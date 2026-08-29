import React, { useState } from 'react';
import { 
  X, 
  Send, 
  User, 
  Clock, 
  Calendar, 
  DollarSign, 
  Lock, 
  MessageSquare,
  Building2,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { normalizeOrderStatus } from './OrderLifecycleStepper';

export interface OrderChatMessage {
  id: string;
  sender: 'customer' | 'provider' | 'system';
  senderName: string;
  text: string;
  timestamp: string;
}

interface OrderChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  orderType: 'hall' | 'service';
  itemTitle: string;
  customerName: string;
  customerPhone?: string;
  bookingDate?: string;
  totalAmount?: number;
  status: string;
  completedAt?: string;
  readOnlyAfterHours?: number; // default 48h from sovereign settings
}

export const OrderChatModal: React.FC<OrderChatModalProps> = ({
  isOpen,
  onClose,
  orderNumber,
  orderType,
  itemTitle,
  customerName,
  customerPhone,
  bookingDate,
  totalAmount,
  status,
  completedAt,
  readOnlyAfterHours = 48
}) => {
  if (!isOpen) return null;

  const normStatus = normalizeOrderStatus(status);

  // Determine if chat is read-only (if completed/cancelled and elapsed past readOnlyAfterHours)
  const isReadOnly = (() => {
    if (normStatus === 'rejected') return true;
    if (normStatus === 'completed' || normStatus === 'cancelled') {
      if (!completedAt) return false;
      const elapsed = Date.now() - new Date(completedAt).getTime();
      const limitMs = readOnlyAfterHours * 60 * 60 * 1000;
      return elapsed > limitMs;
    }
    return false;
  })();

  const [messages, setMessages] = useState<OrderChatMessage[]>([
    {
      id: '1',
      sender: 'system',
      senderName: 'نظام ليلة الذكي',
      text: `تم فتح قناة التواصل المباشرة للطلب (${orderNumber}). نرجو الالتزام بتعليمات وسياسات المنصة.`,
      timestamp: '10:00 ص'
    },
    {
      id: '2',
      sender: 'customer',
      senderName: customerName || 'العميل',
      text: `السلام عليكم، تم تقديم طلب الحجز لمناسبة يوم ${bookingDate || 'المحدد'}. نأمل التنسيق بشأن موعد الدخول والتجهيزات.`,
      timestamp: '10:02 ص'
    },
    {
      id: '3',
      sender: 'provider',
      senderName: 'المزود',
      text: 'وعليكم السلام ورحمة الله وبركاته، مرحباً بك. تم استلام تفاصيل طلبكم ويسعدنا خدمتكم بأعلى معايير الجودة.',
      timestamp: '10:05 ص'
    }
  ]);

  const [inputText, setInputText] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isReadOnly) return;

    const newMsg: OrderChatMessage = {
      id: Date.now().toString(),
      sender: 'provider',
      senderName: 'المزود',
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs" dir="rtl">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* 1. Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 dark:bg-indigo-400/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  شات التواصل للطلب ({orderNumber})
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700">
                  {orderType === 'hall' ? 'حجز قاعة' : 'طلب خدمة'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                محادثة فورية مباشرة مع العميل {customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Pinned Order Context Bar */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-3.5 px-5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-inner">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-bold">
              {orderType === 'hall' ? <Building2 className="w-4 h-4 text-amber-400" /> : <Sparkles className="w-4 h-4 text-indigo-400" />}
              <span>{itemTitle}</span>
            </div>
            <span className="text-slate-500">•</span>
            <div className="flex items-center gap-1 text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{bookingDate || 'الموعد المعتمد'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {totalAmount !== undefined && (
              <div className="flex items-center gap-1 font-bold text-amber-400">
                <DollarSign className="w-3.5 h-3.5" />
                <span>{totalAmount.toLocaleString('en-US')} ر.س</span>
              </div>
            )}
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-slate-200 border border-white/10">
              الحالة: {normStatus}
            </span>
          </div>
        </div>

        {/* 3. Messages List Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-slate-50/40 dark:bg-slate-950/40">
          {messages.map((msg) => {
            if (msg.sender === 'system') {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <div className="bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>{msg.text}</span>
                  </div>
                </div>
              );
            }

            const isMe = msg.sender === 'provider';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] font-bold text-slate-400">
                  <span>{msg.senderName}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>
                <div
                  className={`max-w-[80%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-br-xs shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 rounded-bl-xs shadow-xs'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
        </div>

        {/* 4. Chat Input / Read Only Banner */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          {isReadOnly ? (
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 text-xs flex items-center justify-center gap-2 font-bold">
              <Lock className="w-4 h-4 text-slate-400" />
              <span>المحادثة للقراءة والأرشفة فقط (انقضت مهلة الـ {readOnlyAfterHours} ساعة بعد اكتمال الطلب).</span>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="اكتب رسالتك للعميل هنا..."
                className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Send className="w-4 h-4 rotate-180" />
                <span>إرسال</span>
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
