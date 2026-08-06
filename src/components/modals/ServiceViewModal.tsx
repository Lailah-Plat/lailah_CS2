import React from 'react';
import { Eye, X, MapPin, FileText, ShieldCheck, Award, Star } from 'lucide-react';
import { renderStars } from '../../utils/layoutUtils';

interface ServiceViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  viewingService: any;
  providers: any[];
  enableProviderLevels: boolean;
  getPartnerLevel: (bookingsCount?: number, rating?: number, packageName?: string, bypassToggle?: boolean) => any;
  formatCurrency: (value: number) => string;
  setEditingItem: (item: any) => void;
}

export const ServiceViewModal: React.FC<ServiceViewModalProps> = ({
  isOpen,
  onClose,
  viewingService,
  providers,
  enableProviderLevels,
  getPartnerLevel,
  formatCurrency,
  setEditingItem
}) => {
  if (!isOpen || !viewingService) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] relative">
        <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Eye className="w-6 h-6 text-blue-500" />
            تفاصيل الخدمة: {viewingService.name}
          </h3>
          <button onClick={onClose} className="absolute top-4 xl:top-6 left-4 xl:left-6 z-[60] bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-100 shadow-sm p-2 rounded-full transition-all duration-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Details */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">اسم الخدمة</h4>
                    <p className="text-xl font-bold text-slate-900">{viewingService.name}</p>
                  </div>
                  <div className="text-left" dir="ltr">
                    {(() => {
                       const provider = providers.find(p => p.name === viewingService.provider);
                       const level = provider ? getPartnerLevel(provider.bookingsCount, provider.rating, provider.packageName) : null;
                       if (!enableProviderLevels || !level) return null;
                       return (
                         <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${level.bg} ${level.color} ${level.border} shadow-sm`}>
                           <span>{level.icon}</span>
                           <span>{level.name}</span>
                         </span>
                       );
                    })()}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">المزود</h4>
                    <p className="font-bold text-slate-700">{viewingService.provider}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">التقييم العام</h4>
                    <div className="mt-1">{renderStars(viewingService.rating, viewingService.reviewsCount)}</div>
                  </div>
                </div>

                {viewingService.description && (
                  <div className="pt-4 border-t border-slate-50">
                    <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">وصف الخدمة</h4>
                    <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 italic">{viewingService.description}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs">
                       <span className="text-slate-500 font-bold">سياسة الإلغاء والاسترداد:</span>
                       <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                         {viewingService.cancellationPeriod === undefined || viewingService.cancellationPeriod === "" 
                           ? "غير مستردة نهائياً" 
                           : viewingService.cancellationPeriod === 0 || viewingService.cancellationPeriod === "0" 
                           ? "مستردة حتى موعد تقديم الخدمة" 
                           : `قبل ${viewingService.cancellationPeriod} يوم من الموعد`
                         }
                       </span>
                    </div>
                  </div>
                )}
              </div>

              {/* SERVICE TRANSPARENCY & PARTNER LEVEL CARD FOR INDEPENDENT SERVICES */}
              {enableProviderLevels && (() => {
                const provider = providers.find(p => p.name === viewingService.provider);
                const level = provider ? getPartnerLevel(provider.bookingsCount, provider.rating, provider.packageName) : null;
                return (
                  <div className="bg-white text-slate-800 p-5 rounded-2xl border border-purple-200/90 shadow-sm space-y-3">
                    <div className="flex flex-wrap justify-between items-center gap-2 border-b border-purple-100 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-xl border border-purple-200/80">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black flex items-center gap-1.5 text-slate-900">
                            <span>شفافية أداء الخدمة ومستوى الشراكة</span>
                            <span className="bg-purple-100 text-purple-800 text-[9px] font-black px-2 py-0.5 rounded-full border border-purple-200">
                              مزود معتمد
                            </span>
                          </h4>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            المزود المسؤول: <span className="font-extrabold text-purple-700">{viewingService.provider}</span>
                          </p>
                        </div>
                      </div>

                      {level && (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${level.bg} ${level.color} ${level.border} shadow-sm`}>
                          <span>{level.icon}</span>
                          <span>{level.name}</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                        <span className="text-slate-500 text-[10px] block font-bold">الطلبات المنفذة</span>
                        <strong className="text-xs font-black text-purple-700 mt-0.5 block">
                          {provider?.bookingsCount || viewingService.reviewsCount || 15}+ طلب منفذ
                        </strong>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                        <span className="text-slate-500 text-[10px] block font-bold">تقييم جودة الخدمة</span>
                        <strong className="text-xs font-black text-amber-600 mt-0.5 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                          {viewingService.rating || provider?.rating || 4.9} / 5.0
                        </strong>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                        <span className="text-slate-500 text-[10px] block font-bold">التغطية والسرعة</span>
                        <strong className="text-xs font-black text-emerald-700 mt-0.5 block truncate">
                          تغطية ميدانية سريعة
                        </strong>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                        <span className="text-slate-500 text-[10px] block font-bold">ضمان الخدمة والتأمين</span>
                        <strong className="text-xs font-black text-indigo-700 mt-0.5 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
                          ضمان ليلة 100%
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {viewingService.regions && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-500" /> مناطق تقديم الخدمة
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {viewingService.regions.split('،').map((r: string, i: number) => (
                      <span key={i} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-bold border border-blue-100">{r.trim()}</span>
                    ))}
                  </div>
                </div>
              )}

              {viewingService.terms && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-500" /> شروط وإضافات
                  </h4>
                  <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                    <ul className="space-y-2">
                      {viewingService.terms.split('\n').filter((t: string) => t.trim()).map((term: string, i: number) => (
                        <li key={i} className="text-slate-700 text-sm flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></span>
                          {term}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Info */}
            <div className="space-y-4">
               <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl space-y-6">
                  {(viewingService.unitPrice !== undefined || viewingService.unit) && (
                    <div className="grid grid-cols-2 gap-2 border-b border-slate-800 pb-4">
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase font-bold">سعر الوحدة</p>
                        <p className="text-sm font-bold text-amber-300">{formatCurrency(viewingService.unitPrice || viewingService.price || 0)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase font-bold">الوحدة بالباقة</p>
                        <p className="text-sm font-bold text-slate-100">{viewingService.unit || 'مرة واحدة'}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-tight">السعر الإجمالي</p>
                    {(() => {
                      const prov = providers.find(p => p.name === viewingService.provider);
                      const isVat = prov?.isVatEnabled ?? true;
                      return (
                        <>
                          <p className="text-3xl font-bold text-amber-400">{formatCurrency(viewingService.price)}</p>
                          <p className={`text-[10px] ${isVat ? 'text-emerald-400' : 'text-amber-500'}`}>
                            {isVat ? 'العرض شامل ضريبة القيمة المضافة ومصاريف الخدمة' : 'هذا السعر معفي من ضريبة القيمة المضافة لعدم انطباقها نظاماً'}
                          </p>
                        </>
                      );
                    })()}
                  </div>
                  
                  <div className="pt-4 border-t border-slate-800 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">الكمية المتاحة:</span>
                      <span className="font-bold text-slate-200">{viewingService.quantity || 'غير محدود'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">حالة الخدمة:</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${viewingService.serviceStatus === 'نشط' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {viewingService.serviceStatus}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">الاعتماد:</span>
                      <span className="flex items-center gap-1 text-blue-400 font-bold text-xs">
                         <ShieldCheck className="w-4 h-4" /> معتمدة
                      </span>
                    </div>
                  </div>
               </div>

               {viewingService.images && viewingService.images.length > 0 && (
                 <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                   <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">معرض الصور</h4>
                   <div className="grid grid-cols-2 gap-2">
                      {viewingService.images.slice(0, 4).map((img: any, i: number) => (
                        <div key={i} className="aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-50">
                           <img 
                             src={img.preview || (typeof img === 'string' ? img : '')} 
                             alt="" 
                             className="w-full h-full object-cover transition-transform hover:scale-110 duration-500" 
                             referrerPolicy="no-referrer"
                           />
                        </div>
                      ))}
                   </div>
                   {viewingService.images.length > 4 && (
                     <p className="text-[10px] text-center text-slate-400 mt-2">+{viewingService.images.length - 4} صور إضافية</p>
                   )}
                 </div>
               )}
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
           <div className="text-sm text-slate-500">
              تمت الإضافة بواسطة: <span className="font-bold text-slate-700">{viewingService.hostName}</span>
           </div>
           <button onClick={() => setEditingItem(viewingService)} className="bg-slate-800 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors">تعديل الخدمة</button>
        </div>
      </div>
    </div>
  );
};
