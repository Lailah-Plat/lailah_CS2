import React, { useState } from 'react';
import { Star, AlertTriangle, MessageSquare, ShieldAlert, CheckCircle2, Eye } from 'lucide-react';
import { ReviewDetailModal, ReviewItem, DeviceMetadata, ReviewReply, ReviewEscalation } from './ReviewDetailModal';
import { maskProhibitedContent } from '../utils/contentModeration';

interface ReviewsManagementProps {
  userRole: string;
  allReviews: any[];
  setAllReviews?: React.Dispatch<React.SetStateAction<any[]>>;
  currentProviderName: string;
  showNotification: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  handleDeleteReview: (id: number | string) => Promise<void>;
}

export const ReviewsManagement: React.FC<ReviewsManagementProps> = ({
  userRole,
  allReviews,
  setAllReviews,
  currentProviderName,
  showNotification,
  handleDeleteReview
}) => {
  const [reviewsViewMode, setReviewsViewMode] = useState<'table' | 'grid' | 'list'>('table');
  const [reviewsActiveCategory, setReviewsActiveCategory] = useState<'all' | 'hall' | 'service' | 'provider' | 'chat'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteReviewConfirmId, setDeleteReviewConfirmId] = useState<number | string | null>(null);
  const [selectedReviewForModal, setSelectedReviewForModal] = useState<ReviewItem | null>(null);

  const isProvider = userRole === 'provider';
  
  // Strict Provider Isolation: Only show reviews belonging to current provider
  const reviewsToConsider: ReviewItem[] = isProvider 
    ? (allReviews || []).filter(r => r.providerName === currentProviderName)
    : (allReviews || []);

  const filteredReviews = reviewsToConsider.filter(r => {
    if (reviewsActiveCategory !== 'all') {
      if (r.targetType !== reviewsActiveCategory) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = (r.customerName || '').toLowerCase().includes(q);
      const targetMatch = (r.targetName || '').toLowerCase().includes(q);
      const commentMatch = (r.comment || '').toLowerCase().includes(q);
      const providerMatch = (r.providerName || '').toLowerCase().includes(q);
      return nameMatch || targetMatch || commentMatch || providerMatch;
    }
    return true;
  });

  const hallCount = reviewsToConsider.filter(r => r.targetType === 'hall').length;
  const serviceCount = reviewsToConsider.filter(r => r.targetType === 'service').length;
  const providerCount = reviewsToConsider.filter(r => r.targetType === 'provider').length;
  const chatCount = reviewsToConsider.filter(r => r.targetType === 'chat').length;

  // Local & State Review Updaters
  const handleSaveReplyInModal = (reviewId: number | string, replyText: string, deviceMeta: DeviceMetadata) => {
    const formattedDate = new Date().toLocaleString('ar-SA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const newReplyObj: ReviewReply = {
      id: `rep-${Date.now()}`,
      authorRole: userRole === 'admin' ? 'admin' : 'provider',
      authorName: userRole === 'admin' ? 'إدارة المنصة' : (currentProviderName || 'مزود الخدمة'),
      text: replyText,
      createdAt: formattedDate,
      deviceInfo: deviceMeta
    };

    if (setAllReviews) {
      setAllReviews((prev: any[]) => {
        const updated = prev.map(r => {
          if (String(r.id) === String(reviewId)) {
            const existingReplies = r.replies ? [...r.replies] : [];
            return {
              ...r,
              providerReply: replyText,
              replyDate: formattedDate,
              replies: [...existingReplies, newReplyObj]
            };
          }
          return r;
        });
        localStorage.setItem('allReviews', JSON.stringify(updated));
        return updated;
      });
    }

    // Update active modal item state
    if (selectedReviewForModal && String(selectedReviewForModal.id) === String(reviewId)) {
      const existingReplies = selectedReviewForModal.replies ? [...selectedReviewForModal.replies] : [];
      setSelectedReviewForModal({
        ...selectedReviewForModal,
        providerReply: replyText,
        replyDate: formattedDate,
        replies: [...existingReplies, newReplyObj]
      });
    }
  };

  const handleSaveEscalationInModal = (reviewId: number | string, reason: string, notes: string, deviceMeta: DeviceMetadata) => {
    const formattedDate = new Date().toLocaleString('ar-SA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const escalationObj: ReviewEscalation = {
      id: `esc-${Date.now()}`,
      providerName: currentProviderName || 'مزود الخدمة',
      reason,
      notes,
      status: 'pending',
      createdAt: formattedDate,
      deviceInfo: deviceMeta
    };

    if (setAllReviews) {
      setAllReviews((prev: any[]) => {
        const updated = prev.map(r => {
          if (String(r.id) === String(reviewId)) {
            return {
              ...r,
              escalation: escalationObj
            };
          }
          return r;
        });
        localStorage.setItem('allReviews', JSON.stringify(updated));
        return updated;
      });
    }

    if (selectedReviewForModal && String(selectedReviewForModal.id) === String(reviewId)) {
      setSelectedReviewForModal({
        ...selectedReviewForModal,
        escalation: escalationObj
      });
    }
  };

  const handleAdminResolveEscalation = (reviewId: number | string, newStatus: 'resolved' | 'dismissed') => {
    if (setAllReviews) {
      setAllReviews((prev: any[]) => {
        const updated = prev.map(r => {
          if (String(r.id) === String(reviewId) && r.escalation) {
            return {
              ...r,
              escalation: {
                ...r.escalation,
                status: newStatus
              }
            };
          }
          return r;
        });
        localStorage.setItem('allReviews', JSON.stringify(updated));
        return updated;
      });
    }

    if (selectedReviewForModal && String(selectedReviewForModal.id) === String(reviewId) && selectedReviewForModal.escalation) {
      setSelectedReviewForModal({
        ...selectedReviewForModal,
        escalation: {
          ...selectedReviewForModal.escalation,
          status: newStatus
        }
      });
    }

    showNotification('success', newStatus === 'resolved' ? 'تم قبول التصعيد والتعامل مع المخالفة' : 'تم حفظ قرار رفض التصعيد');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800">إدارة تقييمات العملاء والخدمات والمزودين</h2>
          <p className="text-xs text-slate-500 mt-1">
            اضغط على أي تعليق لفتح النافذة المخصصة للرد المباشر أو رفع تصعيد للإدارة مع التوثيق الزمني والتقيد التام بقواعد الخصوصية
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="بحث بالاسم أو التعليق..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 w-44 md:w-56"
          />
          <button 
            onClick={() => setReviewsViewMode('table')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${reviewsViewMode === 'table' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            جدول
          </button>
          <button 
            onClick={() => setReviewsViewMode('grid')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${reviewsViewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            شبكة
          </button>
          <button 
            onClick={() => setReviewsViewMode('list')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${reviewsViewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            تفاصيل
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200/80 shadow-inner mb-6" dir="rtl">
        <button
          onClick={() => setReviewsActiveCategory('all')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
            reviewsActiveCategory === 'all'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-200'
          }`}
        >
          <span>الكل ({reviewsToConsider.length})</span>
        </button>
        <button
          onClick={() => setReviewsActiveCategory('hall')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
            reviewsActiveCategory === 'hall'
              ? 'bg-amber-500 text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-amber-600 hover:bg-slate-200'
          }`}
        >
          <span>🏛️ تقييمات القاعات ({hallCount})</span>
        </button>
        <button
          onClick={() => setReviewsActiveCategory('service')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
            reviewsActiveCategory === 'service'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-200'
          }`}
        >
          <span>✨ الخدمات المستقلة ({serviceCount})</span>
        </button>
        <button
          onClick={() => setReviewsActiveCategory('provider')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
            reviewsActiveCategory === 'provider'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-purple-600 hover:bg-slate-200'
          }`}
        >
          <span>🏢 تقييم المزودين ({providerCount})</span>
        </button>
        {userRole === 'admin' && (
          <button
            onClick={() => setReviewsActiveCategory('chat')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              reviewsActiveCategory === 'chat'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-blue-600 hover:bg-slate-200'
            }`}
          >
            <span>💬 تقييم الدعم ({chatCount})</span>
          </button>
        )}
      </div>

      {filteredReviews.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Star className="w-12 h-12 mx-auto mb-2 opacity-20" />
          <p className="text-sm font-medium">لا توجد تقييمات في هذا التبويب حالياً</p>
        </div>
      ) : reviewsViewMode === 'table' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                <th className="p-3">اسم العميل</th>
                <th className="p-3">النوع المستهدف</th>
                <th className="p-3">اسم القاعة / الخدمة / المزود</th>
                <th className="p-3">الجهة المزودة / الموظف</th>
                <th className="p-3">التقييم العام</th>
                <th className="p-3 max-w-[280px]">نص التعليق (اضغط لفتح النافذة)</th>
                <th className="p-3">حالة الرد والتصعيد</th>
                <th className="p-3">تاريخ النشر</th>
                <th className="p-3 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredReviews.map((review) => {
                const replyCount = (review.replies || []).length + (review.providerReply ? 1 : 0);
                return (
                  <tr
                    key={review.id}
                    className="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                    onClick={() => setSelectedReviewForModal(review)}
                  >
                    <td className="p-3 font-semibold text-slate-800">{review.customerName}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        review.targetType === 'hall'
                          ? 'bg-amber-50 text-amber-700 border border-amber-100'
                          : review.targetType === 'service'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : review.targetType === 'provider'
                          ? 'bg-purple-50 text-purple-700 border border-purple-100'
                          : 'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}>
                        {review.targetType === 'hall' 
                          ? '🏛️ قاعة مناسبات' 
                          : review.targetType === 'service' 
                          ? '✨ خدمة مستقلة' 
                          : review.targetType === 'provider' 
                          ? '🏢 مزود الخدمة' 
                          : '💬 دعم فني'}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-slate-700">{review.targetName}</td>
                    <td className="p-3 text-slate-500">{review.providerName || review.agentName || '-'}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-amber-500">{review.rating}</span>
                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                      </div>
                    </td>
                    <td className="p-3 max-w-[280px]">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-slate-800 font-medium line-clamp-2 group-hover:text-indigo-600 transition-colors">
                          "{maskProhibitedContent(review.comment, userRole)}"
                        </span>
                        <span className="text-[10px] text-indigo-500 font-bold underline flex items-center gap-0.5">
                          <Eye className="w-3 h-3" />
                          <span>عرض التعليق والسلسلة الكاملة</span>
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1 items-start">
                        {replyCount > 0 ? (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10.5px] font-bold flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            <span>تم الرد ({replyCount})</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">لا يوجد رد</span>
                        )}

                        {review.escalation && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 border ${
                            review.escalation.status === 'resolved'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            <ShieldAlert className="w-3 h-3 text-amber-600" />
                            <span>{review.escalation.status === 'resolved' ? 'تم حسم التصعيد' : 'مرفوع للإدارة'}</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-xs text-slate-400 font-mono">{review.date}</td>
                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedReviewForModal(review)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-200 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>التفاصيل والرد</span>
                        </button>
                        {userRole === 'admin' && (
                          <button 
                            onClick={() => setDeleteReviewConfirmId(review.id)}
                            className="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold border border-red-200 transition-colors cursor-pointer"
                          >
                            حذف
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : reviewsViewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.map((review) => {
            const replyCount = (review.replies || []).length + (review.providerReply ? 1 : 0);
            return (
              <div 
                key={review.id} 
                onClick={() => setSelectedReviewForModal(review)}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 hover:shadow-lg transition-all relative flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{review.customerName}</h4>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{review.date}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg text-xs font-black text-amber-600 border border-amber-100">
                      <span>{review.rating}</span>
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed mb-4 italic line-clamp-3 bg-white p-3 rounded-xl border border-slate-200/80">
                    "{maskProhibitedContent(review.comment, userRole)}"
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-3 flex flex-col gap-2 text-[11px] text-slate-500">
                  <div className="flex justify-between items-center w-full">
                    <span className="font-bold text-slate-700">{review.targetName}</span>
                    <span className="text-indigo-600 font-bold underline flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>فتح النوافذة</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {replyCount > 0 && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold">
                        {replyCount} رد مسجل
                      </span>
                    )}
                    {review.escalation && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[10px] font-bold">
                        تصعيد للإدارة
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => {
            const replyCount = (review.replies || []).length + (review.providerReply ? 1 : 0);
            return (
              <div 
                key={review.id} 
                onClick={() => setSelectedReviewForModal(review)}
                className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer bg-white group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="bg-indigo-600 text-white p-2.5 rounded-xl font-bold shrink-0 text-sm">
                      {review.customerName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{review.customerName}</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {review.targetType === 'hall' ? 'قاعة مناسبات' : review.targetType === 'service' ? 'خدمة مضافة' : review.targetType === 'chat' ? 'دعم فني' : 'مزود الخدمة'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 font-medium">
                        الهدف: {review.targetName} • {review.date}
                      </p>
                      <p className="text-xs text-slate-700 mt-2 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                        "{maskProhibitedContent(review.comment, userRole)}"
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg text-xs font-bold text-amber-600 border border-amber-100">
                      <span>{review.rating}</span>
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    </div>
                    
                    <button className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-sm group-hover:bg-indigo-700 transition-all flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>عرض النافذة والتفاعل</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Detail & Action Modal Thread */}
      {selectedReviewForModal && (
        <ReviewDetailModal
          review={selectedReviewForModal}
          userRole={userRole}
          currentProviderName={currentProviderName}
          onClose={() => setSelectedReviewForModal(null)}
          onSaveReply={handleSaveReplyInModal}
          onSaveEscalation={handleSaveEscalationInModal}
          onAdminResolveEscalation={handleAdminResolveEscalation}
          onDeleteReview={userRole === 'admin' ? (id) => {
            handleDeleteReview(id);
            setSelectedReviewForModal(null);
          } : undefined}
          showNotification={showNotification}
        />
      )}

      {/* Delete Confirmation Modal for Reviews */}
      {deleteReviewConfirmId !== null && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 font-sans" dir="rtl">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 transform scale-100 transition-all duration-300">
            <div className="flex items-center gap-3 text-red-600 mb-4 select-none">
              <div className="bg-red-50 p-3 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">تأكيد حذف التقييم</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              هل أنت متأكد من رغبتك في حذف هذا التقييم وتحديث المؤشر العام للرضا بنجاح؟ لا يمكن التراجع عن هذا الإجراء بعد إتمامه.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteReviewConfirmId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  if (deleteReviewConfirmId !== null) {
                    handleDeleteReview(deleteReviewConfirmId);
                  }
                  setDeleteReviewConfirmId(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                نعم، حذف ومراقبة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
