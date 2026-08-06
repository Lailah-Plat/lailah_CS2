import React, { useState } from 'react';
import { Star, User, MessageSquare, Ban } from 'lucide-react';
import { maskProhibitedContent } from '../utils/contentModeration';

interface ReviewCardProps {
  review: any;
  isProvider?: boolean;
  onReply: (text: string) => void;
  showNotification: (type: string, message: string) => void;
}

export const ReviewGridCard = ({ review, isProvider, onReply, showNotification }: ReviewCardProps) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow relative overflow-hidden group">
      {review.targetType === 'chat' && review.resolution && (
        <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] px-3 py-1 font-bold rounded-bl-xl shadow-sm">تم حل المشكلة</div>
      )}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 border border-slate-200">
            {review.customerName[0]}
          </div>
          <div>
            <h4 className="font-bold text-slate-900 leading-tight">{review.customerName}</h4>
            <p className="text-xs text-slate-400 font-medium">{review.date}</p>
          </div>
        </div>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map(s => (
            <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <span className={`w-2 h-2 rounded-full ${
            review.targetType === 'hall' ? 'bg-blue-500' :
            review.targetType === 'service' ? 'bg-purple-500' :
            review.targetType === 'provider' ? 'bg-orange-500' : 'bg-emerald-500'
          }`}></span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {review.targetType === 'hall' ? 'قاعة' : review.targetType === 'service' ? 'خدمة' : review.targetType === 'provider' ? 'شريك' : 'دعم فني'}
          </span>
        </div>
        <p className="font-bold text-slate-800 text-sm mb-1">{review.targetName}</p>
        {review.agentName && <p className="text-xs text-slate-500 flex items-center gap-1"><User className="w-3 h-3" /> الموظف: {review.agentName}</p>}
      </div>

      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 italic text-slate-600 text-sm leading-relaxed mb-4">
        "{maskProhibitedContent(review.comment, isProvider ? 'provider' : 'client')}"
      </div>

      {review.providerReply ? (
        <div className="mt-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100/50 relative">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-3 h-3 text-blue-600" />
            <span className="text-[10px] font-bold text-blue-600">رد مزود الخدمة</span>
            <span className="text-[10px] text-blue-400 mr-auto">{review.replyDate}</span>
          </div>
          <p className="text-xs text-blue-800 leading-relaxed font-medium">
            {maskProhibitedContent(review.providerReply, isProvider ? 'provider' : 'client')}
          </p>
        </div>
      ) : isReplying ? (
        <div className="mt-4 space-y-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="اكتب ردك هنا... (سيظهر للعملاء)"
            className="w-full p-3 text-sm rounded-xl border border-slate-200 focus:border-blue-500 outline-none h-24 resize-none"
          />
          <div className="flex gap-2">
            <button 
              onClick={() => { onReply(replyText); setIsReplying(false); }}
              className="flex-1 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700"
            >
              إرسال الرد
            </button>
            <button 
              onClick={() => setIsReplying(false)}
              className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200"
            >
              إلغاء
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          {!isProvider && <button className="flex-1 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-100 transition-colors">تغاضي</button>}
          <button 
            onClick={() => isProvider ? setIsReplying(true) : showNotification('info', 'سياسة النظام: الرد للمزودين فقط')}
            className="flex-1 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-100 transition-colors"
          >
            {review.providerReply ? 'تعديل الرد' : 'الرد على التقييم'}
          </button>
        </div>
      )}
    </div>
  );
};

export const ReviewListCard = ({ review, isProvider, onReply, showNotification }: ReviewCardProps) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState(review.providerReply || '');

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:border-slate-200 transition-all flex flex-col md:flex-row gap-6">
      <div className="shrink-0 flex flex-col items-center">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 border border-slate-200 text-xl mb-3">
          {review.customerName[0]}
        </div>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map(s => (
            <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
          ))}
        </div>
      </div>
      
      <div className="flex-1">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="font-bold text-slate-900">{review.customerName}</h4>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                review.targetType === 'hall' ? 'bg-blue-50 text-blue-600' :
                review.targetType === 'service' ? 'bg-purple-50 text-purple-600' :
                'bg-emerald-50 text-emerald-600'
              }`}>
                {review.targetName}
              </span>
              <span className="text-[10px] text-slate-400">{review.date}</span>
            </div>
          </div>
          {!review.providerReply && !isReplying && (
            <button 
              onClick={() => isProvider ? setIsReplying(true) : null}
              className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100"
            >
              رد سريع
            </button>
          )}
        </div>
        
        <p className="text-slate-600 text-sm italic mb-4 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
          "{maskProhibitedContent(review.comment, isProvider ? 'provider' : 'client')}"
        </p>

        {review.providerReply ? (
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100/50">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="w-3 h-3 text-blue-600" />
              <span className="text-[10px] font-bold text-blue-600">رد الـ {review.providerName || 'مزود'}</span>
              <span className="text-[10px] text-blue-400 mr-auto">{review.replyDate}</span>
            </div>
            <p className="text-xs text-blue-800 font-medium">
              {maskProhibitedContent(review.providerReply, isProvider ? 'provider' : 'client')}
            </p>
          </div>
        ) : isReplying && (
          <div className="mt-2 space-y-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="اكتب ردك هنا..."
              className="w-full p-3 text-sm rounded-xl border border-slate-200 focus:border-blue-500 outline-none h-20 resize-none"
            />
            <div className="flex gap-2">
              <button onClick={() => { onReply(replyText); setIsReplying(false); }} className="px-6 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg">إرسال</button>
              <button onClick={() => setIsReplying(false)} className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg border border-slate-200">إلغاء</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const ReviewTableRow = ({ review, isProvider, onReply, showNotification }: ReviewCardProps) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState(review.providerReply || '');

  return (
    <>
      <tr className="hover:bg-slate-50/50 transition-colors group">
        <td className="p-4">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 border border-slate-200 text-xs">
                {review.customerName[0]}
             </div>
             <div className="font-bold text-slate-800 text-sm">{review.customerName}</div>
          </div>
        </td>
        <td className="p-4 text-center">
          <div className="flex items-center justify-center gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
            ))}
          </div>
          <span className="text-[10px] text-slate-400 font-bold">{review.rating} / 5</span>
        </td>
        <td className="p-4">
           <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-800">{review.targetName}</span>
              <span className="text-[9px] text-slate-400">{review.targetType === 'hall' ? 'قاعة' : 'خدمة'}</span>
           </div>
        </td>
        <td className="p-4">
           <div className="text-xs text-slate-600 max-w-xs truncate" title={review.comment}>{review.comment}</div>
        </td>
        <td className="p-4 text-xs text-slate-400 font-mono">
           {review.date}
        </td>
        <td className="p-4 text-left">
           <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsReplying(!isReplying)}
                className={`p-2 rounded-lg transition-all ${review.providerReply ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white'}`}
                title="الرد على التقييم"
              >
                 <MessageSquare className="w-4 h-4" />
              </button>
              {!isProvider && (
                <button className="p-2 bg-slate-100 text-slate-400 hover:text-red-500 rounded-lg transition-all">
                  <Ban className="w-4 h-4" />
                </button>
              )}
           </div>
        </td>
      </tr>
      {isReplying && (
        <tr className="bg-blue-50/30">
          <td colSpan={6} className="p-6 border-x border-blue-100/50">
             <div className="flex flex-col gap-4 max-w-2xl">
                <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm italic text-slate-600 text-sm">
                  "{review.comment}"
                </div>
                <div className="space-y-3">
                   <label className="text-xs font-bold text-slate-600 block">ردك المقترح للعميل</label>
                   <textarea 
                     value={replyText}
                     onChange={(e) => setReplyText(e.target.value)}
                     placeholder="اكتب ردك هنا..."
                     className="w-full p-4 rounded-xl border border-slate-200 focus:border-blue-500 outline-none min-h-[120px] shadow-inner bg-white"
                   />
                   <div className="flex justify-end gap-3">
                     <button 
                       onClick={() => setIsReplying(false)}
                       className="px-6 py-2 text-slate-500 font-bold text-sm hover:bg-slate-100 rounded-xl transition-all"
                     >
                       إلغاء
                     </button>
                     <button 
                       onClick={() => { onReply(replyText); setIsReplying(false); }}
                       className="px-8 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
                     >
                       حفظ الرد وتنشيط التقييم
                     </button>
                   </div>
                </div>
             </div>
          </td>
        </tr>
      )}
    </>
  );
};
