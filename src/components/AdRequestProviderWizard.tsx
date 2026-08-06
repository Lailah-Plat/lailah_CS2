import React, { useState } from 'react';
import { Megaphone, ExternalLink, Receipt, CheckCircle, Clock, XCircle, Play } from 'lucide-react';

export const AdRequestsTable = ({ 
  requests, 
  userRole, 
  onStatusChange 
}: { 
  requests: any[]; 
  userRole?: string; 
  onStatusChange?: (id: number, status: 'نشطة' | 'ملغية' | 'قيد المراجعة', requestData: any) => void;
}) => {
  const isAdmin = userRole === 'admin';

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mt-8">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h3 className="text-lg font-bold text-slate-800">طلبات الإعلان داخل المنصة</h3>
          <p className="text-xs text-slate-500 mt-1">
            {isAdmin 
              ? 'مراجعة وتفعيل وتأكيد الدفع لطلبات الإعلان المرفوعة من المزودين' 
              : 'تابع حالة طلبات الإعلانات الداخلي وإجراءات تفعيلها'}
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-100 text-slate-600 text-[11px] font-black uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="p-4 font-bold">رقم الطلب</th>
              <th className="p-4 font-bold">المُعلن</th>
              <th className="p-4 font-bold">الموقع المستهدف</th>
              <th className="p-4 font-bold">نوع الإعلان</th>
              <th className="p-4 font-bold">الميزانية المقترحة</th>
              <th className="p-4 font-bold">تاريخ البداية / النهاية</th>
              <th className="p-4 font-bold">الحالة</th>
              {isAdmin && <th className="p-4 font-bold text-left pl-6">إجراءات التحكم</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="p-12 text-center text-slate-400 font-medium">
                  لا توجد طلبات إعلان حالياً
                </td>
              </tr>
            ) : (
              requests.map((r: any) => {
                // Determine computed statuses based on current date
                const now = new Date();
                now.setHours(0, 0, 0, 0);

                const getRequestEndDate = (req: any) => {
                  if (req.endDate) return new Date(req.endDate);
                  if (req.startDate) {
                    const d = new Date(req.startDate);
                    d.setDate(d.getDate() + 30);
                    return d;
                  }
                  return null;
                };

                const reqEnd = getRequestEndDate(r);
                if (reqEnd) {
                  reqEnd.setHours(0, 0, 0, 0);
                }

                const isEnded = reqEnd ? reqEnd.getTime() < now.getTime() : false;

                let computedStatus = r.status;
                if (isEnded) {
                  if (r.status === 'نشطة' || r.status === 'نشط' || r.status === 'مدفوع') {
                    computedStatus = 'مكتمل';
                  } else if (r.status === 'قيد المراجعة' || r.status === 'مسودة' || r.status === 'معلق') {
                    computedStatus = 'منتهي';
                  }
                }

                const isApprovedStatus = computedStatus === 'نشطة' || computedStatus === 'نشط' || computedStatus === 'مدفوع';
                const isCancelledStatus = computedStatus === 'ملغية' || computedStatus === 'ملغى' || computedStatus === 'مرفوض';
                const isCompletedStatus = computedStatus === 'مكتمل';
                const isExpiredStatus = computedStatus === 'منتهي';
                
                return (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 text-slate-600 font-mono font-bold">#{r.id}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{r.providerName || r.advertiserName || 'غير محدد'}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{r.advertiserPhone || 'بريد المزود'}</div>
                    </td>
                    <td className="p-4 text-slate-600">{r.adLocation || '-'}</td>
                    <td className="p-4 text-slate-600">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-medium font-sans">
                        {r.adType || '-'}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-indigo-650 font-extrabold text-[13px]">
                      {r.adBudget ? `${r.adBudget} ر.س` : '-'}
                    </td>
                    <td className="p-4 font-mono text-slate-700">
                      <div className="font-bold text-[12px]">{r.startDate || '-'}</div>
                      <div className="font-bold text-[11px] text-slate-400 mt-1 flex items-center gap-1 select-none">
                        <span>↲</span>
                        <span>{r.endDate || (reqEnd ? reqEnd.toISOString().split('T')[0] : '-')}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {isCompletedStatus ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold border bg-teal-50 text-teal-800 border-teal-200">
                          <CheckCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>مكتمل</span>
                        </span>
                      ) : isExpiredStatus ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border bg-slate-100 text-slate-500 border-slate-200">
                          <XCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>منتهي</span>
                        </span>
                      ) : isApprovedStatus ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
                          <Play className="w-3 h-3 stroke-[2.5] fill-current" />
                          <span>نشطة</span>
                        </span>
                      ) : isCancelledStatus ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border bg-red-50 text-red-700 border-red-200">
                          <XCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>ملغية</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border bg-amber-50 text-amber-700 border-amber-200 animate-pulse">
                          <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>{computedStatus || 'قيد المراجعة'}</span>
                        </span>
                      )}
                    </td>
                    
                    {/* Admin management actions */}
                    {isAdmin && (
                      <td className="p-4 text-left">
                        {isCompletedStatus ? (
                          <span className="text-[10px] font-bold text-teal-600 px-2.5">
                            ✅ مكتمل (انتهت المدة)
                          </span>
                        ) : isExpiredStatus ? (
                          <span className="text-[10px] font-bold text-slate-400 px-2.5">
                            ⚠️ منتهي (دون تفعيل)
                          </span>
                        ) : !isApprovedStatus && !isCancelledStatus ? (
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => onStatusChange?.(r.id, 'نشطة', r)}
                              className="bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.02] active:scale-95 text-white font-bold text-[10px] px-3 py-1.5 rounded-xl transition-all shadow-sm shadow-emerald-100 flex items-center gap-1 cursor-pointer"
                              title="تأكيد وتفعيل طلب الإعلان"
                            >
                              <span>تأكيد وتفعيل</span>
                            </button>
                            <button
                              onClick={() => onStatusChange?.(r.id, 'ملغية', r)}
                              className="bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 font-bold text-[10px] px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                              title="إلغاء / رفض طلب الإعلان"
                            >
                              <span>رفض</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 px-2.5">
                            {isApprovedStatus ? '✅ تم التفعيل والتشغيل' : '❌ ملغي'}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const AdRequestProviderWizard = ({ onSubmit, currentUserData }: any) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: 'طلب إعلان داخلي',
    advertiserName: currentUserData?.name || currentUserData?.fullName || '',
    advertiserPhone: currentUserData?.phone || '',
    advertiserEmail: currentUserData?.email || '',
    adType: 'صورة (بنر)', // 'نصي', 'صورة', 'فيديو'
    adLocation: 'أعلى الصفحة الرئيسية',
    destinationUrl: '',
    adContent: '',
    targetInterests: '',
    targetLocations: '',
    adBudget: 0,
    startDate: '',
    endDate: '',
    legalAttachments: ''
  });

  const handleNext = () => setStep(prev => prev + 1);
  const handlePrev = () => setStep(prev => prev - 1);
  
  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      status: 'مسودة', // Wait for payment
      type: 'طلب إعلان داخلي',
      spent: 0
    });
  };

  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 mb-6 shadow-sm">
      <div className="flex items-center gap-4 mb-6 border-b border-slate-50 pb-4">
        <div className="w-10 h-10 bg-blue-50 text-blue-900 rounded-xl flex items-center justify-center">
          <Megaphone className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800">طلب إعلان داخل المنصة</h3>
          <p className="text-sm text-slate-500">قدم طلب إعلان ليعرض لمستخدمي المنصة، سيتم التواصل لتأكيد الدفع</p>
        </div>
      </div>

      <div className="flex mb-8">
        {[1, 2, 3].map(i => (
          <div key={i} className={`flex-1 h-2 rounded-full mx-1 ${step >= i ? 'bg-blue-900' : 'bg-slate-100'}`} />
        ))}
      </div>

      <form onSubmit={step === 3 ? submitForm : (e) => { e.preventDefault(); handleNext(); }} className="space-y-6">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h4 className="font-bold text-lg text-slate-800 mb-4">معلومات المُعلن ومواصفات الإعلان</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">اسم المُعلن</label>
                <input required type="text" value={formData.advertiserName} onChange={e => setFormData({...formData, advertiserName: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">رقم الجوال لتأكيد الدفع</label>
                <input required type="tel" value={formData.advertiserPhone} onChange={e => setFormData({...formData, advertiserPhone: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-left" dir="ltr" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">نوع الإعلان</label>
                <select required value={formData.adType} onChange={e => setFormData({...formData, adType: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none border-r-8 border-transparent focus:border-blue-900">
                  {(() => {
                    try {
                      const stored = localStorage.getItem('SYSTEM_DATastore_adTypes');
                      return stored ? JSON.parse(stored) as string[] : ['صورة (بنر)', 'نصي', 'فيديو قصير'];
                    } catch {
                      return ['صورة (بنر)', 'نصي', 'فيديو قصير'];
                    }
                  })().map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">موقع الإعلان</label>
                <select required value={formData.adLocation} onChange={e => setFormData({...formData, adLocation: e.target.value})} className="w-full p-3 border border-slate-250 rounded-xl outline-none border-r-8 border-transparent focus:border-blue-900">
                  {(() => {
                    const defaults = [
                      'أعلى الصفحة الرئيسية', 
                      'شريط جانبي في قائمة الخدمات', 
                      'أسفل تفاصيل الحجز', 
                      'نافذة منبثقة (Popup)',
                      'شريط الإعلانات العلوي - يمين',
                      'شريط الإعلانات العلوي - وسط',
                      'شريط الإعلانات العلوي - يسار',
                      'شريط الإعلانات السفلي - يمين',
                      'شريط الإعلانات السفلي - وسط',
                      'شريط الإعلانات السفلي - يسار'
                    ];
                    try {
                      const stored = localStorage.getItem('SYSTEM_DATastore_adLocations');
                      if (stored) {
                        const parsed = JSON.parse(stored) as string[];
                        let hasChanges = false;
                        defaults.forEach(d => {
                          if (!parsed.includes(d)) {
                            parsed.push(d);
                            hasChanges = true;
                          }
                        });
                        if (hasChanges) {
                          localStorage.setItem('SYSTEM_DATastore_adLocations', JSON.stringify(parsed));
                        }
                        return parsed;
                      }
                      return defaults;
                    } catch {
                      return defaults;
                    }
                  })().map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h4 className="font-bold text-lg text-slate-800 mb-4">محتوى الإعلان والجمهور</h4>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">الرابط الوجهة (عنوان URL)</label>
              <div className="relative">
                <ExternalLink className="absolute right-3 top-3.5 w-5 h-5 text-slate-400" />
                <input type="url" placeholder="https://" value={formData.destinationUrl} onChange={e => setFormData({...formData, destinationUrl: e.target.value})} className="w-full p-3 pr-10 border border-slate-200 rounded-xl text-left outline-none focus:border-blue-900" dir="ltr" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">محتوى الإعلان (نص / وصف / روابط للتصاميم)</label>
              <textarea required rows={4} value={formData.adContent} onChange={e => setFormData({...formData, adContent: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-900" placeholder="اكتب النص الإعلاني أو أضف رابط لمجلد يحوي التصاميم..."></textarea>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">اهتمامات الفئة المستهدفة</label>
                <input type="text" placeholder="مثال: حفلات زفاف، فعاليات شركات..." value={formData.targetInterests} onChange={e => setFormData({...formData, targetInterests: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">الاستهداف الجغرافي</label>
                <input type="text" placeholder="مثال: الرياض، جدة..." value={formData.targetLocations} onChange={e => setFormData({...formData, targetLocations: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-900" />
              </div>
            </div>
            
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-2">معلومات قانونية / تراخيص (اختياري)</label>
               <input type="text" placeholder="رقم ترخيص أو رابط لمستند..." value={formData.legalAttachments} onChange={e => setFormData({...formData, legalAttachments: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-900" />
             </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h4 className="font-bold text-lg text-slate-800 mb-4">الميزانية والتأكيد</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">تاريخ البداية المستهدف</label>
                <input required type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">تاريخ النهاية المستهدف</label>
                <input required type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-900" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">الميزانية الإجمالية (ر.س)</label>
              <input required type="number" min="100" value={formData.adBudget || ''} onChange={e => setFormData({...formData, adBudget: parseInt(e.target.value) || 0})} className="w-full p-3 border border-slate-200 rounded-xl text-lg font-bold text-blue-900 outline-none focus:border-blue-900" />
              <p className="text-xs text-slate-500 mt-2">يتم تحويل قيمة الإعلان عبر الحساب البنكي بعد تأكيد الإدارة للطلب</p>
            </div>
            
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start gap-3 mt-4">
              <Receipt className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-bold mb-1">تأكيد طلب الإعلان</p>
                <p>بعد إرسال الطلب، ستقوم إدارة المنصة بمراجعته. وسيتم التواصل معك على الجوال المسجل <strong>{formData.advertiserPhone || 'المدخل أعلاه'}</strong> لتأكيد عملية الدفع وتحويل قيمة الإعلان، ثم سيتم تفعيل الإعلان وعرضه.</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-6 border-t border-slate-100 mt-8">
          {step > 1 ? (
            <button type="button" onClick={handlePrev} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">السابق</button>
          ) : <div></div>}
          
          <button type="submit" className="px-8 py-2.5 rounded-xl font-bold bg-blue-900 text-white hover:bg-blue-800 transition-colors shadow-md">
            {step === 3 ? 'إرسال طلب الإعلان' : 'التالي'}
          </button>
        </div>
      </form>
    </div>
  );
};
