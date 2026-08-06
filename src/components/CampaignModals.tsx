import React from 'react';
import { Megaphone, X } from 'lucide-react';

interface CampaignForm {
  title: string;
  type: string;
  targetAudience: string;
  budget: number;
  startDate: string;
  endDate: string;
  status: string;
  content: string;
}

interface CampaignModalsProps {
  isCampaignModalOpen: boolean;
  isCampaignViewModalOpen: boolean;
  editingItem: any;
  viewingCampaign: any;
  campaignForm: CampaignForm;
  setCampaignForm: React.Dispatch<React.SetStateAction<CampaignForm>>;
  setIsCampaignModalOpen: (open: boolean) => void;
  setIsCampaignViewModalOpen: (open: boolean) => void;
  campaigns: any[];
  setCampaigns: React.Dispatch<React.SetStateAction<any[]>>;
  formatCurrency: (amount: number) => string;
}

export function CampaignModals({
  isCampaignModalOpen,
  isCampaignViewModalOpen,
  editingItem,
  viewingCampaign,
  campaignForm,
  setCampaignForm,
  setIsCampaignModalOpen,
  setIsCampaignViewModalOpen,
  campaigns,
  setCampaigns,
  formatCurrency
}: CampaignModalsProps) {

  if (!isCampaignModalOpen && !isCampaignViewModalOpen) return null;

  return (
    <>
      {/* Campaign Modal */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" dir="rtl">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] relative">
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Megaphone className="w-6 h-6 text-amber-500" />
                {editingItem ? 'تعديل حملة تسويقية' : 'إنشاء حملة تسويقية جديدة'}
              </h3>
              <button onClick={() => setIsCampaignModalOpen(false)} className="absolute top-4 xl:top-6 left-4 xl:left-6 z-[60] bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-100 shadow-sm p-2 rounded-full transition-all duration-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">اسم الحملة <span className="text-red-500">*</span></label>
                  <input type="text" value={campaignForm.title || ''} onChange={e => setCampaignForm({...campaignForm, title: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none" placeholder="مثال: خصومات الصيف..." />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">نوع الحملة <span className="text-red-500">*</span></label>
                    <select value={campaignForm.type || ''} onChange={e => setCampaignForm({...campaignForm, type: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:border-amber-500 outline-none">
                      <option value="SMS">رسائل نصية SMS</option>
                      <option value="Email">بريد إلكتروني</option>
                      <option value="Social Media">سوشيال ميديا</option>
                      <option value="Push Notification">إشعار للتطبيق</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">الجمهور المستهدف <span className="text-red-500">*</span></label>
                    <select value={campaignForm.targetAudience || ''} onChange={e => setCampaignForm({...campaignForm, targetAudience: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:border-amber-500 outline-none">
                      <option value="الكل">الكل (العملاء والمزودين)</option>
                      <option value="العملاء النشطين">العملاء النشطين فقط</option>
                      <option value="العملاء الحاليين">جميع العملاء</option>
                      <option value="المزودين الحاليين">مزودي الخدمات</option>
                      <option value="المزودين المحتملين">مزودين محتملين (لم يكملوا التسجيل)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">الميزانية</label>
                    <input type="number" value={campaignForm.budget ?? 0} onChange={e => setCampaignForm({...campaignForm, budget: Number(e.target.value) || 0})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">من تاريخ</label>
                    <input type="date" value={campaignForm.startDate || ''} onChange={e => setCampaignForm({...campaignForm, startDate: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">إلى تاريخ</label>
                    <input type="date" value={campaignForm.endDate || ''} onChange={e => setCampaignForm({...campaignForm, endDate: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">حالة الحملة</label>
                  <select value={campaignForm.status || ''} onChange={e => setCampaignForm({...campaignForm, status: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:border-amber-500 outline-none">
                    <option value="مسودة">مسودة</option>
                    <option value="مجدولة">مجدولة</option>
                    <option value="نشطة">نشطة</option>
                    <option value="مكتملة">مكتملة</option>
                    <option value="ملغاة">ملغاة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">محتوى الحملة</label>
                  <textarea value={campaignForm.content || ''} onChange={e => setCampaignForm({...campaignForm, content: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none min-h-[120px]" placeholder="اكتب نص الرسالة أو البريد هنا..."></textarea>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0 gap-3">
              <button type="button" onClick={() => setIsCampaignModalOpen(false)} className="px-6 py-3 rounded-xl font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">إلغاء</button>
              <button type="button" onClick={() => {
                if (!campaignForm.title) {
                  alert("الرجاء إدخال اسم الحملة.");
                  return;
                }
                const newCampaign = {
                  ...campaignForm,
                  id: editingItem ? editingItem.id : Date.now(),
                  spent: editingItem?.spent || 0,
                  reach: editingItem?.reach || 0,
                  clicks: editingItem?.clicks || 0,
                  conversions: editingItem?.conversions || 0,
                };
                if (editingItem) {
                  setCampaigns(campaigns.map((c: any) => c.id === editingItem.id ? newCampaign : c));
                } else {
                  setCampaigns([newCampaign, ...campaigns]);
                }
                setIsCampaignModalOpen(false);
              }} className="px-6 py-3 rounded-xl font-bold bg-amber-500 text-slate-900 hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/30">
                {editingItem ? 'حفظ التعديلات' : 'إنشاء الحملة'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign View Modal */}
      {isCampaignViewModalOpen && viewingCampaign && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" dir="rtl">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] relative">
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Megaphone className="w-6 h-6 text-amber-500" />
                تفاصيل الحملة: {viewingCampaign.title}
              </h3>
              <button onClick={() => setIsCampaignViewModalOpen(false)} className="absolute top-4 xl:top-6 left-4 xl:left-6 z-[60] bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-100 shadow-sm p-2 rounded-full transition-all duration-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                  <p className="text-xs text-blue-600 font-bold mb-1">الوصول</p>
                  <p className="text-xl font-bold text-blue-900">{viewingCampaign.reach?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                  <p className="text-xs text-amber-600 font-bold mb-1">النقرات</p>
                  <p className="text-xl font-bold text-amber-900">{viewingCampaign.clicks?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                  <p className="text-xs text-purple-600 font-bold mb-1">التحويلات</p>
                  <p className="text-xl font-bold text-purple-900">{viewingCampaign.conversions?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                  <p className="text-xs text-green-600 font-bold mb-1">المبلغ المنصرف</p>
                  <p className="text-xl font-bold text-green-900">{formatCurrency(viewingCampaign.spent || 0)}</p>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <div>
                    <p className="text-xs text-slate-500">النوع</p>
                    <p className="font-bold text-slate-800">{viewingCampaign.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">الحالة</p>
                    <p className="font-bold text-slate-800">{viewingCampaign.status}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">الجمهور المستهدف</p>
                    <p className="font-bold text-slate-800">{viewingCampaign.targetAudience}</p>
                  </div>
                </div>
                <div>
                    <p className="text-xs text-slate-500 mb-2">محتوى الحملة</p>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-700 leading-relaxed font-medium">
                      {viewingCampaign.content || 'لا يوجد محتوى'}
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
