import React, { useState } from 'react';
import { Camera, MapPin, Coffee, Plus, Lock, Check, AlertTriangle, X } from 'lucide-react';
import { motion } from 'motion/react';
import { safeSetLocalStorage } from '../../../../utils/safeStorage';

interface ProviderServicesCatalogProps {
  catalogServices: any[];
  setCatalogServices: React.Dispatch<React.SetStateAction<any[]>>;
  showNotification: (type: string, message: string) => void;
  setIsMediaGuideOpen?: (open: boolean) => void;
  setOsTab?: (tab: any) => void;
  currentProviderName?: string;
  hasDynamicPricingAccess?: boolean;
  formatCurrency?: (val: number) => string;
}

export const ProviderServicesCatalog: React.FC<ProviderServicesCatalogProps> = ({
  catalogServices,
  setCatalogServices,
  showNotification,
  setIsMediaGuideOpen = () => {},
  setOsTab = () => {},
  currentProviderName = 'ليالينا للضيافة والاحتفالات',
  hasDynamicPricingAccess = true,
  formatCurrency = (val: number) => typeof val === 'number' ? `${val.toLocaleString('ar-SA')} ر.س` : `${val || ''}`,
}) => {
  // Service Wizard State
  const [serviceWizStep, setServiceWizStep] = useState(1);
  const [serviceWizRole, setServiceWizRole] = useState<'provider' | 'admin'>('provider');
  const [serviceWizData, setServiceWizData] = useState({
    name: '',
    category: 'ضيافة',
    provider: currentProviderName || 'ليالينا للضيافة والاحتفالات',
    desc: '',
    unitPrice: '150',
    unit: 'ساعة',
    dailyStock: '5',
    cancellationPeriod: '٤٨ ساعة قبل موعد الفعالية',
    coverageRegions: ['منطقة الرياض'] as string[],
    coverageCities: ['الرياض'] as string[],
    adminStatus: 'معلق بانتظار الاعتماد', // 'معلق بانتظار الاعتماد' | 'معتمد من الإدارة' | 'مرفوض'
    serviceStatus: 'نشط', // 'نشط' | 'غير نشط'
    terms: 'يلتزم العميل بتوفير متطلبات التشغيل المتفق عليها. تخضع عمليات الإلغاء لسياسة الاسترداد والمهلة المحددة.',
    images: [] as Array<{ name: string; size: number; preview: string; width?: number; height?: number }>,
    fulfillmentPolicy: 'Internal', // 'Internal' | 'Hybrid'
    dynamicWeekend: true,
    dynamicSeasonal: false,
    dynamicVolume: false,
  });

  return (
                    <div className="space-y-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      {/* Subtab Header */}
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-slate-100 gap-3">
                        <div>
                          <span className="text-[10px] font-black text-indigo-600 tracking-wider font-mono block mb-1">SUPPORTIVE & INDEPENDENT SERVICES CATALOG</span>
                          <h3 className="text-base font-black text-slate-800">كتالوج وإدارة الخدمات المستقلة والمساندة</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsMediaGuideOpen(true)}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-950 text-emerald-300 font-extrabold text-xs flex items-center gap-2 border border-emerald-500/40 shadow-sm transition-all active:scale-95 cursor-pointer"
                            title="فتح دليل واشتراطات تصوير ورفع الوسائط (الصور والفيديوهات)"
                          >
                            <Camera className="w-4 h-4 text-emerald-400" />
                            <span>دليل تصوير ورفع الوسائط 📷</span>
                          </button>
                          <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-2xl flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span className="text-[11px] font-bold text-slate-600">منظومة الخدمات اللامركزية النشطة</span>
                          </div>
                        </div>
                      </div>

                      {/* Service Grid Section */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {catalogServices.map((ser) => {
                          // Try to handle parsed images or fallbacks
                          let serImages: any[] = [];
                          if (ser.images) {
                            if (Array.isArray(ser.images)) {
                              serImages = ser.images;
                            } else if (typeof ser.images === 'string') {
                              try { serImages = JSON.parse(ser.images); } catch(e) { serImages = []; }
                            }
                          }
                          const hasImages = serImages && serImages.length > 0;
                          const coverImage = hasImages ? (serImages[0].preview || serImages[0].dataUrl || serImages[0]) : null;

                          return (
                            <div key={ser.id} className="bg-white border border-slate-150 rounded-2xl overflow-hidden hover:border-purple-200 hover:shadow-md transition-all flex flex-col justify-between">
                              {/* Service Main Content Container */}
                              <div>
                                {coverImage ? (
                                  <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                                    <img src={coverImage} alt={ser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-xl shadow-sm text-[10px] font-black text-purple-700">
                                      {ser.category || 'عام'}
                                    </div>
                                    <div className="absolute bottom-3 left-3 bg-purple-900/80 backdrop-blur-sm px-2.5 py-1 rounded-xl text-[10px] font-mono text-white">
                                      {ser.id}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="h-32 bg-slate-50 border-b border-slate-100 flex items-center justify-center relative">
                                    <Coffee className="w-8 h-8 text-slate-300" />
                                    <div className="absolute top-3 right-3 bg-purple-100 px-2.5 py-1 rounded-xl text-[10px] font-black text-purple-700">
                                      {ser.category || 'عام'}
                                    </div>
                                    <div className="absolute bottom-3 left-3 bg-slate-100 px-2.5 py-1 rounded-xl text-[10px] font-mono text-slate-500">
                                      {ser.id}
                                    </div>
                                  </div>
                                )}

                                <div className="p-4 space-y-3">
                                  <div className="flex justify-between items-start gap-2">
                                    <h4 className="text-sm font-black text-slate-800 text-right leading-snug">{ser.name}</h4>
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                        ser.status === 'Pending Approval' || ser.status === 'معلق بانتظار الاعتماد'
                                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                          : ser.status === 'مرفوض'
                                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      }`}>
                                        {ser.status || 'معتمد'}
                                      </span>
                                      {ser.serviceStatus && (
                                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                                          ser.serviceStatus === 'نشط' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                          حالة المزود: {ser.serviceStatus}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <p className="text-[11px] text-slate-500 leading-relaxed text-right line-clamp-2">
                                    {ser.desc || 'لا يوجد وصف مسجل للخدمة حالياً.'}
                                  </p>

                                  {/* Detailed Metadata Grid */}
                                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100 text-[10px] text-slate-600 bg-slate-50/50 p-2 rounded-xl">
                                    <div className="text-right">
                                      <span className="text-slate-400 block text-[9px]">المزود المسؤول</span>
                                      <span className="font-black text-slate-800 truncate block max-w-full" title={ser.provider || currentProviderName}>
                                        {ser.provider || currentProviderName}
                                      </span>
                                    </div>
                                    <div className="text-right border-r border-slate-150 pr-2">
                                      <span className="text-slate-400 block text-[9px]">الوحدة والمخزون</span>
                                      <span className="font-black text-slate-800 block">
                                        {ser.dailyStock || '5'} طلبات / {ser.unit || 'مناسبة'}
                                      </span>
                                    </div>
                                    <div className="text-right border-r border-slate-150 pr-2">
                                      <span className="text-slate-400 block text-[9px]">سياسة التنفيذ</span>
                                      <span className="font-black text-indigo-700 block">
                                        {ser.fulfillmentPolicy === 'Hybrid' ? 'هجين (Hybrid)' : 'داخلي (Internal)'}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Extra properties if available */}
                                  {(ser.coverageRegions || ser.cancellationPeriod) && (
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                      {ser.coverageRegions && (
                                        <span className="bg-purple-50 text-purple-800 text-[9px] font-bold px-1.5 py-0.5 rounded border border-purple-100">
                                          🌍 {Array.isArray(ser.coverageRegions) ? ser.coverageRegions.join('، ') : ser.coverageRegions}
                                        </span>
                                      )}
                                      {ser.cancellationPeriod && (
                                        <span className="bg-amber-50 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-100">
                                          ⏳ إلغاء مجاني: {ser.cancellationPeriod}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Price Footer */}
                              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center rounded-b-2xl">
                                <span className="text-[10px] text-slate-400 font-bold">سعر الوحدة القياسي</span>
                                <span className="font-mono text-purple-700 font-black text-xs">
                                  {formatCurrency(ser.price || ser.unitPrice || 0)} / {ser.unit || 'مرة'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Independent Service Wizard (BOS-Style v2.6) */}
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/80 space-y-5 mt-6 shadow-sm">
                        
                        {/* Interactive Role Switcher at the top of the wizard to demonstrate Admin vs Provider rules */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-indigo-50/60 p-3 rounded-2xl border border-indigo-100 gap-3">
                          <div className="space-y-0.5">
                            <span className="text-indigo-900 font-black text-xs block">🛡️ محاكي التحكم والصلاحيات (Access Switcher)</span>
                            <p className="text-[10px] text-indigo-700 leading-relaxed">
                              استخدم هذا الخيار للتبديل الفوري بين رتبة **مُزود الخدمة** و**الإدارة (Admin)** لمشاهدة ديناميكية وتأثير العزل والصلاحيات البرمجية على الحقول أدناه.
                            </p>
                          </div>
                          <div className="flex bg-white p-1 rounded-xl border border-indigo-150 shrink-0 shadow-sm">
                            <button
                              type="button"
                              onClick={() => {
                                setServiceWizRole('provider');
                                setServiceWizData(prev => ({ ...prev, provider: currentProviderName }));
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${serviceWizRole === 'provider' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                              حساب المزود (مغلق الصلاحيات)
                            </button>
                            <button
                              type="button"
                              onClick={() => setServiceWizRole('admin')}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${serviceWizRole === 'admin' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                              حساب الإدارة (صلاحية تعديل واعتماد)
                            </button>
                          </div>
                        </div>

                        {/* Wizard Step Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                          <div className="flex items-center gap-2">
                            <span className="bg-purple-100 text-purple-700 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase font-mono tracking-wider shadow-sm">Supportive Wizard v2.6</span>
                            <span className="text-[11px] font-black text-slate-500">الخطوة {serviceWizStep} من ٥</span>
                          </div>
                          <div className="flex items-center gap-2 text-purple-700">
                            <Plus className="w-4 h-4" />
                            <h4 className="text-xs font-black">معالج إدارة وإضافة الخدمات المستقلة والمساندة المتقدمة</h4>
                          </div>
                        </div>

                        {/* Step Progress Indicators */}
                        <div className="grid grid-cols-5 gap-1.5 text-center text-[9px] font-black pb-1">
                          <div className={`p-2 rounded-xl transition-all border ${serviceWizStep === 1 ? 'bg-purple-600 text-white border-purple-600 shadow-sm' : 'bg-white text-slate-500 border-slate-200/60'}`}>
                            ١. الهوية والسياسة
                          </div>
                          <div className={`p-2 rounded-xl transition-all border ${serviceWizStep === 2 ? 'bg-purple-600 text-white border-purple-600 shadow-sm' : 'bg-white text-slate-500 border-slate-200/60'}`}>
                            ٢. التسعير والمخزون
                          </div>
                          <div className={`p-2 rounded-xl transition-all border ${serviceWizStep === 3 ? 'bg-purple-600 text-white border-purple-600 shadow-sm' : 'bg-white text-slate-500 border-slate-200/60'}`}>
                            ٣. التغطية والمهل
                          </div>
                          <div className={`p-2 rounded-xl transition-all border ${serviceWizStep === 4 ? 'bg-purple-600 text-white border-purple-600 shadow-sm' : 'bg-white text-slate-500 border-slate-200/60'}`}>
                            ٤. ألبوم الصور والشروط
                          </div>
                          <div className={`p-2 rounded-xl transition-all border ${serviceWizStep === 5 ? 'bg-purple-600 text-white border-purple-600 shadow-sm' : 'bg-white text-slate-500 border-slate-200/60'}`}>
                            ٥. المراجعة والاعتماد
                          </div>
                        </div>

                        {/* Step 1: Definition, Provider Name, Fulfillment Policy & Description */}
                        {serviceWizStep === 1 && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Service Name */}
                              <div className="space-y-1">
                                <label className="text-[11px] font-black text-slate-600 block text-right">اسم الخدمة المستقلة والمساندة المعروضة *</label>
                                <input
                                  type="text"
                                  value={serviceWizData.name}
                                  onChange={(e) => setServiceWizData({ ...serviceWizData, name: e.target.value })}
                                  placeholder="مثال: طاقم ضيافة نسائي VIP متكامل"
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-bold text-slate-800 focus:border-purple-500 transition-all"
                                />
                              </div>

                              {/* Service Category */}
                              <div className="space-y-1">
                                <label className="text-[11px] font-black text-slate-600 block text-right">تصنيف فئة الخدمة الرئيسي *</label>
                                <select
                                  value={serviceWizData.category}
                                  onChange={(e) => setServiceWizData({ ...serviceWizData, category: e.target.value })}
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-bold text-slate-700 focus:border-purple-500 transition-all"
                                >
                                  <option value="ضيافة">ضيافة وتقديم بوفيهات ومشروبات</option>
                                  <option value="ديكور">ديكور وتنسيق كوش وزهور طبيعية</option>
                                  <option value="تصوير">توثيق وفوتوغرافيا وتغطية سينمائية</option>
                                  <option value="تنسيق">تجهيزات هندسة صوت وإضاءة وليزرات</option>
                                  <option value="أخرى">خدمات دعم ومساندة لوجستية أخرى</option>
                                </select>
                              </div>
                            </div>

                            {/* Provider Assignment Field (Dynamic based on Role Switcher) */}
                            <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] font-mono font-black text-slate-400">PROVIDER ASSIGNMENT ENGINE</span>
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${serviceWizRole === 'admin' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                  {serviceWizRole === 'admin' ? 'حساب الإدارة: وضع التعديل متاح' : 'حساب المزود: وضع القراءة فقط'}
                                </span>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[11px] font-black text-slate-600 block text-right">المزود المالك والمشغل للخدمة *</label>
                                {serviceWizRole === 'admin' ? (
                                  <input
                                    type="text"
                                    value={serviceWizData.provider}
                                    onChange={(e) => setServiceWizData({ ...serviceWizData, provider: e.target.value })}
                                    className="w-full p-2.5 border border-emerald-300 bg-white rounded-xl text-xs outline-none text-right font-black text-slate-800 focus:border-emerald-500 transition-all"
                                    placeholder="أدخل اسم المزود مالك الخدمة (متاح فقط للإدارة)"
                                  />
                                ) : (
                                  <div className="w-full p-2.5 bg-slate-200/80 border border-slate-300 rounded-xl text-xs font-black text-slate-600 text-right cursor-not-allowed">
                                    {serviceWizData.provider}
                                  </div>
                                )}
                                <span className="text-[9px] text-slate-400 block text-right leading-relaxed">
                                  {serviceWizRole === 'admin' 
                                    ? 'ℹ️ بصفتك مديراً للنظام، يسمح لك بتعديل أو إعادة تخصيص هذه الخدمة لأي شريك/مزود خدمات مسجل بالمنصة.' 
                                    : 'ℹ️ بصفتك شريكاً ومزود خدمات، يتم قفل هذا الحقل تلقائياً على اسم الهوية المسجلة في ملفك التجاري.'}
                                </span>
                              </div>
                            </div>

                            {/* Fulfillment / Execution Policy Selector */}
                            <div className="space-y-2">
                              <label className="text-[11px] font-black text-slate-600 block text-right">سياسة التجهيز والتنفيذ اللوجستي (Fulfillment Policy) *</label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <button
                                  type="button"
                                  onClick={() => setServiceWizData({ ...serviceWizData, fulfillmentPolicy: 'Internal' })}
                                  className={`p-3.5 rounded-2xl border text-right transition-all flex items-start gap-3 cursor-pointer ${serviceWizData.fulfillmentPolicy === 'Internal' ? 'bg-indigo-50/70 border-indigo-500 text-indigo-950 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                                >
                                  <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${serviceWizData.fulfillmentPolicy === 'Internal' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'}`}>
                                    {serviceWizData.fulfillmentPolicy === 'Internal' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-xs font-black block">تنفيذ داخلي مباشر (Internal Execution)</span>
                                    <span className="text-[10px] text-slate-500 block leading-relaxed">يتم تقديم وتنفيذ وتأمين الخدمة بالكامل عبر الطاقم الداخلي التابع للمنشأة ومواردها الخاصة.</span>
                                  </div>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setServiceWizData({ ...serviceWizData, fulfillmentPolicy: 'Hybrid' })}
                                  className={`p-3.5 rounded-2xl border text-right transition-all flex items-start gap-3 cursor-pointer ${serviceWizData.fulfillmentPolicy === 'Hybrid' ? 'bg-purple-50/70 border-purple-500 text-purple-950 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                                >
                                  <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${serviceWizData.fulfillmentPolicy === 'Hybrid' ? 'border-purple-600 bg-purple-600' : 'border-slate-300 bg-white'}`}>
                                    {serviceWizData.fulfillmentPolicy === 'Hybrid' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-xs font-black block">تنفيذ هجين وتعاقدي (Hybrid / External Partner)</span>
                                    <span className="text-[10px] text-slate-500 block leading-relaxed">تنفذ الخدمة أو تتكامل بالتعاقد الخارجي والتنسيق اللوجستي مع أطراف ومزودين فرعيين مستقلين.</span>
                                  </div>
                                </button>
                              </div>
                            </div>

                            {/* Service Description */}
                            <div className="space-y-1">
                              <label className="text-[11px] font-black text-slate-600 block text-right">وصف الخدمة التجاري ومكونات الطلب بالتفصيل *</label>
                              <textarea
                                value={serviceWizData.desc}
                                onChange={(e) => setServiceWizData({ ...serviceWizData, desc: e.target.value })}
                                rows={3}
                                placeholder="صف بالتفصيل ما تحتويه الخدمة للعملاء، مثل الطاقم، جودة المكونات، الأدوات المستخدمة، والتجهيزات اللوجستية المصاحبة لتفادي أي خلاف قانوني..."
                                className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right text-slate-700 focus:border-purple-500 transition-all leading-relaxed"
                              />
                            </div>
                          </motion.div>
                        )}

                        {/* Step 2: Pricing, Units, Daily Stock, Total Standard Capacity & Dynamic Markup Simulator */}
                        {serviceWizStep === 2 && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Unit Price */}
                              <div className="space-y-1">
                                <label className="text-[11px] font-black text-slate-600 block text-right">سعر الوحدة القياسي للخدمة (ر.س) *</label>
                                <input
                                  type="number"
                                  value={serviceWizData.unitPrice}
                                  onChange={(e) => setServiceWizData({ ...serviceWizData, unitPrice: e.target.value })}
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono font-bold text-slate-800 focus:border-purple-500 transition-all"
                                />
                              </div>

                              {/* Standard Unit */}
                              <div className="space-y-1">
                                <label className="text-[11px] font-black text-slate-600 block text-right">الوحدة القياسية للخدمة *</label>
                                <select
                                  value={serviceWizData.unit}
                                  onChange={(e) => setServiceWizData({ ...serviceWizData, unit: e.target.value })}
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-bold text-slate-700 focus:border-purple-500 transition-all"
                                >
                                  <option value="ساعة">لكل ساعة عمل</option>
                                  <option value="يوم / مناسبة">لكل مناسبة / ليلة كاملة</option>
                                  <option value="فرد / ضيف">لكل ضيف / فرد</option>
                                  <option value="قطعة">لكل قطعة واحدة</option>
                                  <option value="طقم">لكل طقم / طقم تشغيل متكامل</option>
                                </select>
                              </div>

                              {/* Daily Stock Quantity */}
                              <div className="space-y-1">
                                <label className="text-[11px] font-black text-slate-600 block text-right">كمية المخزون / سعة التجهيز اليومي القصوى *</label>
                                <input
                                  type="number"
                                  value={serviceWizData.dailyStock}
                                  onChange={(e) => setServiceWizData({ ...serviceWizData, dailyStock: e.target.value })}
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono font-bold text-slate-800 focus:border-purple-500 transition-all"
                                  placeholder="مثال: 5 طلبات يومياً كحد أقصى"
                                />
                              </div>
                            </div>

                            {/* Total Price & Revenue Calculation Display */}
                            <div className="bg-purple-950 text-white p-4 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-3">
                              <div className="text-right space-y-0.5">
                                <span className="text-[10px] text-purple-200 font-bold block">🧮 محتسب السعة والقيمة الكلية لمخزون الخدمة</span>
                                <p className="text-[11px] text-purple-300 leading-relaxed">
                                  يمثل هذا حاصل السعر الأساسي للوحدة مضروباً في كمية التشغيل/المخزون اليومي الأقصى المتوفر لديكم.
                                </p>
                              </div>
                              <div className="bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 text-center shrink-0">
                                <span className="text-[9px] text-purple-200 block font-bold">السعر الإجمالي الأقصى اليومي للمخزون</span>
                                <span className="font-mono text-base font-black tracking-wide block mt-1">
                                  {((Number(serviceWizData.unitPrice) || 0) * (Number(serviceWizData.dailyStock) || 0)).toLocaleString()} ر.س
                                </span>
                              </div>
                            </div>

                             {/* Dynamic Pricing Policy Configuration */}
                             <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3 relative overflow-hidden">
                               {!hasDynamicPricingAccess && (
                                 <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center text-center p-4">
                                   <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-100 max-w-sm space-y-2">
                                     <div className="bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 mx-auto">
                                       <Lock className="w-3 h-3 text-amber-600" />
                                       <span>ميزة مقفلة - تتطلب ترقية الباقة</span>
                                     </div>
                                     <h6 className="text-xs font-black text-slate-800">محرك الأسعار الديناميكي والذكاء التشغيلي</h6>
                                     <p className="text-[10px] text-slate-500 leading-relaxed">
                                       هذه الميزة تتوفر حصرياً لمشتركي الباقة الاحترافية الملكية (Layla Pro ERP) أو من خلال شراء الملحق المستقل من مركز الاشتراكات.
                                     </p>
                                     <button
                                       type="button"
                                       onClick={() => {
                                         setOsTab('subscription');
                                         showNotification('info', 'تم توجيهك لمركز الاشتراكات لترقية الباقة أو شراء ملحق الأسعار الديناميكية.');
                                       }}
                                       className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black transition-all cursor-pointer shadow-sm mx-auto block"
                                     >
                                       الترقية أو الشراء الآن (تبدأ من 299 ر.س)
                                     </button>
                                   </div>
                                 </div>
                               )}
                               
                               <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                 <span className="text-[10px] font-mono text-purple-600 font-bold">DYNAMIC PRICING ENGINE</span>
                                 <h5 className="text-xs font-black text-slate-800">سياسات التسعير الديناميكي والذكاء التشغيلي</h5>
                               </div>
                               
                               <p className="text-[10px] text-slate-500 leading-relaxed text-right">
                                 قم بتفعيل قواعد التسعير الديناميكي المخصصة للخدمة. ستتعدل أسعارك تلقائياً على المنصة للمستأجر بناءً على ظروف وتوقيت حجز المناسبة:
                               </p>

                               <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                                 <label className="flex items-start gap-2.5 cursor-pointer text-xs font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 hover:border-purple-300 transition-all">
                                   <input
                                     type="checkbox"
                                     checked={serviceWizData.dynamicWeekend}
                                     onChange={(e) => setServiceWizData({ ...serviceWizData, dynamicWeekend: e.target.checked })}
                                     className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 mt-0.5"
                                     disabled={!hasDynamicPricingAccess}
                                   />
                                   <span className="text-right">
                                     <span className="font-black text-slate-800 block text-[11px] mb-0.5">زيادة الويكند (+15%)</span>
                                     <span className="text-[10px] text-slate-500 font-normal block leading-relaxed">تُطبق تلقائياً على الحجوزات أيام الخميس، الجمعة والسبت.</span>
                                   </span>
                                 </label>

                                 <label className="flex items-start gap-2.5 cursor-pointer text-xs font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 hover:border-purple-300 transition-all">
                                   <input
                                     type="checkbox"
                                     checked={serviceWizData.dynamicSeasonal}
                                     onChange={(e) => setServiceWizData({ ...serviceWizData, dynamicSeasonal: e.target.checked })}
                                     className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 mt-0.5"
                                     disabled={!hasDynamicPricingAccess}
                                   />
                                   <span className="text-right">
                                     <span className="font-black text-slate-800 block text-[11px] mb-0.5">زيادة المواسم (+25%)</span>
                                     <span className="text-[10px] text-slate-500 font-normal block leading-relaxed">تُطبق في مواسم الأعياد، رمضان، والمناسبات الوطنية.</span>
                                   </span>
                                 </label>

                                 <label className="flex items-start gap-2.5 cursor-pointer text-xs font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 hover:border-purple-300 transition-all">
                                   <input
                                     type="checkbox"
                                     checked={serviceWizData.dynamicVolume}
                                     onChange={(e) => setServiceWizData({ ...serviceWizData, dynamicVolume: e.target.checked })}
                                     className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 mt-0.5"
                                     disabled={!hasDynamicPricingAccess}
                                   />
                                   <span className="text-right">
                                     <span className="font-black text-slate-800 block text-[11px] mb-0.5">خصم الكميات بالجملة (-10%)</span>
                                     <span className="text-[10px] text-slate-500 font-normal block leading-relaxed">يُطبق خصم تلقائي للعميل عند طلب 10 وحدات فما فوق.</span>
                                   </span>
                                 </label>
                               </div>

                               {/* Interactive Live Price Simulator */}
                               <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-2 pt-3">
                                 <span className="text-[9px] font-black text-slate-400 block text-right uppercase tracking-wider">🔴 معالج المحاكاة الفورية للأسعار (Real-time Price Simulator)</span>
                                 <div className="grid grid-cols-3 gap-2 text-center">
                                   <div className="bg-white p-2 rounded-lg border border-slate-200">
                                     <span className="text-[9px] text-slate-400 block font-bold">السعر العادي (وسط الأسبوع)</span>
                                     <span className="text-xs font-mono font-black text-slate-800">
                                       {formatCurrency(Number(serviceWizData.unitPrice) || 0)}
                                     </span>
                                   </div>
                                   <div className={`p-2 rounded-lg border transition-all ${serviceWizData.dynamicWeekend && hasDynamicPricingAccess ? 'bg-purple-50/50 border-purple-200' : 'bg-slate-100/50 border-slate-200 opacity-60'}`}>
                                     <span className="text-[9px] text-purple-700 block font-bold">سعر نهاية الأسبوع (+15%)</span>
                                     <span className="text-xs font-mono font-black text-purple-800 block mt-0.5">
                                       {serviceWizData.dynamicWeekend && hasDynamicPricingAccess 
                                         ? formatCurrency(Math.round((Number(serviceWizData.unitPrice) || 0) * 1.15)) 
                                         : 'غير مفعل'}
                                     </span>
                                   </div>
                                   <div className={`p-2 rounded-lg border transition-all ${serviceWizData.dynamicSeasonal && hasDynamicPricingAccess ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-100/50 border-slate-200 opacity-60'}`}>
                                     <span className="text-[9px] text-amber-700 block font-bold">سعر المواسم والأعياد (+25%)</span>
                                     <span className="text-xs font-mono font-black text-amber-800 block mt-0.5">
                                       {serviceWizData.dynamicSeasonal && hasDynamicPricingAccess 
                                         ? formatCurrency(Math.round((Number(serviceWizData.unitPrice) || 0) * 1.25)) 
                                         : 'غير مفعل'}
                                     </span>
                                   </div>
                                 </div>
                               </div>
                             </div>
                          </motion.div>
                        )}

                        {/* Step 3: Geographic Coverage Regions, Served Cities & Cancellation Period */}
                        {serviceWizStep === 3 && (() => {
                          const regionCitiesMap: Record<string, string[]> = {
                            'منطقة الرياض': ['الرياض', 'الخرج', 'الدرعية', 'المجمعة', 'الدوادمي'],
                            'منطقة مكة المكرمة': ['مكة المكرمة', 'جدة', 'الطائف', 'القنفذة', 'الليث'],
                            'منطقة المدينة المنورة': ['المدينة المنورة', 'ينبع', 'العلا', 'بدر', 'المهد'],
                            'المنطقة الشرقية': ['الدمام', 'الخبر', 'الأحساء', 'القطيف', 'الجبيل', 'حفر الباطن'],
                            'منطقة عسير': ['أبها', 'خميس مشيط', 'أحد رفيدة', 'محايل عسير', 'بيشة'],
                            'منطقة القصيم': ['بريدة', 'عنيزة', 'الرس', 'البكيرية', 'المذنب']
                          };

                          const availableCities = serviceWizData.coverageRegions.reduce<string[]>((acc, region) => {
                            if (regionCitiesMap[region]) {
                              acc.push(...regionCitiesMap[region]);
                            }
                            return acc;
                          }, []);

                          return (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Coverage Regions */}
                                <div className="space-y-2">
                                  <label className="text-[11px] font-black text-slate-600 block text-right flex items-center gap-1 justify-end">
                                    <span>مناطق التغطية الجغرافية المستهدفة بالمملكة *</span>
                                    <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                                  </label>
                                  <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-2xl border border-slate-200">
                                    {Object.keys(regionCitiesMap).map(region => (
                                      <label key={region} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 hover:text-purple-700 transition-all">
                                        <input
                                          type="checkbox"
                                          checked={serviceWizData.coverageRegions.includes(region)}
                                          onChange={(e) => {
                                            let updatedRegions = [...serviceWizData.coverageRegions];
                                            if (e.target.checked) {
                                              updatedRegions.push(region);
                                            } else {
                                              updatedRegions = updatedRegions.filter(r => r !== region);
                                            }
                                            
                                            // Dynamic city filtering to prevent orphaned checked cities
                                            const remainingCities = updatedRegions.reduce<string[]>((acc, r) => {
                                              if (regionCitiesMap[r]) acc.push(...regionCitiesMap[r]);
                                              return acc;
                                            }, []);
                                            const updatedCities = serviceWizData.coverageCities.filter(city => remainingCities.includes(city));

                                            setServiceWizData({ 
                                              ...serviceWizData, 
                                              coverageRegions: updatedRegions,
                                              coverageCities: updatedCities
                                            });
                                          }}
                                          className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                        />
                                        <span>{region}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>

                                {/* Served Cities */}
                                <div className="space-y-2">
                                  <label className="text-[11px] font-black text-slate-600 block text-right flex items-center gap-1 justify-end">
                                    <span>المدن المخدومة والمغطاة بالخدمة تفصيلياً *</span>
                                  </label>
                                  <div className="bg-white p-3 rounded-2xl border border-slate-200 min-h-[120px] flex flex-col justify-center">
                                    {availableCities.length > 0 ? (
                                      <div className="grid grid-cols-2 gap-2">
                                        {availableCities.map(city => (
                                          <label key={city} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 hover:text-purple-700 transition-all">
                                            <input
                                              type="checkbox"
                                              checked={serviceWizData.coverageCities.includes(city)}
                                              onChange={(e) => {
                                                let updatedCities = [...serviceWizData.coverageCities];
                                                if (e.target.checked) {
                                                  updatedCities.push(city);
                                                } else {
                                                  updatedCities = updatedCities.filter(c => c !== city);
                                                }
                                                setServiceWizData({ ...serviceWizData, coverageCities: updatedCities });
                                              }}
                                              className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                            />
                                            <span>{city}</span>
                                          </label>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-center text-[11px] text-slate-400 font-bold py-4">
                                        ⚠️ يرجى اختيار منطقة تغطية واحدة على الأقل من اليمين لتظهر المدن التابعة لها هنا.
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Cancellation Period Configuration */}
                              <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 text-right">
                                <label className="text-[11px] font-black text-slate-600 block text-right">مدة ومهلة الإلغاء المجاني الممنوحة للعملاء (Cancellation Period) *</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {/* Presets Selector */}
                                  <div className="space-y-1 text-right">
                                    <label className="text-[10px] text-slate-400 block">اختر من الخيارات المقترحة:</label>
                                    <select
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          setServiceWizData({ ...serviceWizData, cancellationPeriod: e.target.value });
                                        }
                                      }}
                                      className="w-full p-2.5 border border-slate-200 bg-slate-50/50 rounded-xl text-xs outline-none text-right font-bold text-slate-700 focus:border-purple-500 transition-all"
                                    >
                                      <option value="">-- اختر مهلة أو اكتبها يدوياً --</option>
                                      <option value="قبل ٢٤ ساعة من الفعالية">قبل ٢٤ ساعة من موعد الفعالية</option>
                                      <option value="قبل ٤٨ ساعة من الفعالية">قبل ٤٨ ساعة من موعد الفعالية</option>
                                      <option value="قبل ٣ أيام من الفعالية">قبل ٣ أيام من موعد الفعالية</option>
                                      <option value="قبل ٧ أيام من الفعالية">قبل ٧ أيام من موعد الفعالية</option>
                                      <option value="قبل ١٤ يوم من الفعالية">قبل ١٤ يوم من موعد الفعالية</option>
                                      <option value="غير مسترد بالكامل">غير مسترد نهائياً بالكامل (No Refund)</option>
                                    </select>
                                  </div>
                                  {/* Custom Text Input */}
                                  <div className="space-y-1 text-right">
                                    <label className="text-[10px] text-slate-400 block">أو حدد واكتب مهلتك الخاصة بالتفصيل:</label>
                                    <input
                                      type="text"
                                      value={serviceWizData.cancellationPeriod}
                                      onChange={(e) => setServiceWizData({ ...serviceWizData, cancellationPeriod: e.target.value })}
                                      placeholder="مثال: قبل ٣٦ ساعة، أو قبل ٥ أيام من الفعالية"
                                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none text-right font-bold text-slate-800 focus:border-indigo-500 transition-all"
                                    />
                                  </div>
                                </div>
                                <span className="text-[9px] text-slate-400 block text-right mt-1">
                                  * تضمن هذه السياسة حماية مستحقات مزود الخدمة من الإلغاءات المفاجئة والتعسفية من قِبل المستأجرين. يمكنك كتابة وتحديد أي مدة أو شروط إلغاء تفضلها.
                                </span>
                              </div>
                            </motion.div>
                          );
                        })()}

                        {/* Step 4: Photo Album Upload with Strict AGENTS.md Validations, Terms and Conditions & Provider Status */}
                        {serviceWizStep === 4 && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            
                            {/* Photo Album drag & drop area */}
                            <div className="space-y-2 bg-white p-4 rounded-2xl border border-slate-200">
                              <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-2">
                                <span className="text-[9px] font-mono font-black text-rose-500">MEDIA QUALITY RULES (AGENTS.MD)</span>
                                <h5 className="text-xs font-black text-slate-800">ألبوم صور الخدمة المساعدة المعتمد (الحد الأقصى 5 صور)</h5>
                              </div>
                              
                              <p className="text-[10px] text-slate-500 leading-relaxed text-right">
                                للالتزام الصارم بقوانين الجودة في منصة ليلة وقواعد صور **AGENTS.md**، يجب أن يتوافق أي ملف يتم رفعه مع الشروط أدناه:
                              </p>

                              {/* Visual Badges of constraints */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[9px] font-black">
                                <div className="bg-slate-50 border border-slate-150 p-1.5 rounded-lg text-slate-600">
                                  الصيغ: JPEG, PNG, WebP
                                </div>
                                <div className="bg-slate-50 border border-slate-150 p-1.5 rounded-lg text-rose-700">
                                  الحجم الأقصى: 500KB
                                </div>
                                <div className="bg-slate-50 border border-slate-150 p-1.5 rounded-lg text-indigo-700">
                                  الحد الأدنى: 960x540 بكسل
                                </div>
                                <div className="bg-slate-50 border border-slate-150 p-1.5 rounded-lg text-purple-700">
                                  الحد الأقصى: 1280x720 بكسل
                                </div>
                              </div>

                              {/* Upload Dropzone */}
                              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50/50 hover:border-purple-300 transition-all relative">
                                <input
                                  type="file"
                                  id="service-images-upload"
                                  multiple
                                  accept=".jpg,.jpeg,.png,.webp"
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  onChange={(e) => {
                                    const files = Array.from(e.target.files || []);
                                    if (files.length === 0) return;

                                    if (serviceWizData.images.length + files.length > 5) {
                                      showNotification('error', 'الحد الأقصى المسموح به لألبوم صور الخدمة المساعدة هو 5 صور فقط.');
                                      return;
                                    }

                                    files.forEach(file => {
                                      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
                                      const ext = file.name.split('.').pop()?.toLowerCase();
                                      const isAllowedExt = ['png', 'jpg', 'jpeg', 'webp'].includes(ext || '');
                                      
                                      if (!allowedTypes.includes(file.type) && !isAllowedExt) {
                                        showNotification('error', `الملف ${file.name} غير مدعوم. يدعم فقط صيغ JPG, PNG, WEBP.`);
                                        return;
                                      }

                                      if (file.size > 500 * 1024) {
                                        showNotification('error', `تجاوز حجم الملف الحد المسموح به (500KB): ${file.name} (الحجم: ${Math.round(file.size / 1024)}KB).`);
                                        return;
                                      }

                                      const reader = new FileReader();
                                      reader.onload = (readerEvent) => {
                                        const dataUrl = readerEvent.target?.result as string;
                                        const img = new Image();
                                        img.onload = () => {
                                          const width = img.width;
                                          const height = img.height;

                                          if (width < 960 || width > 1280 || height < 540 || height > 720) {
                                            showNotification('error', `أبعاد الصورة غير مطابقة لقواعد المنصة: ${file.name} (${width}x${height}px). يجب أن تكون الأبعاد ما بين 960x540 و 1280x720 بكسل.`);
                                            return;
                                          }

                                          setServiceWizData(prev => ({
                                            ...prev,
                                            images: [...prev.images, { name: file.name, size: file.size, preview: dataUrl, width, height }]
                                          }));
                                          showNotification('success', `تم قبول الصورة ${file.name} ومطابقتها للشروط بنجاح (${width}x${height}px).`);
                                        };
                                        img.src = dataUrl;
                                      };
                                      reader.readAsDataURL(file);
                                    });
                                  }}
                                />
                                <span className="text-slate-400 font-bold text-xs block mb-1">قم بسحب وإفلات صور الخدمة هنا أو انقر للتصفح المباشر</span>
                                <span className="text-[10px] text-slate-400 font-mono block">يدعم فقط الصور المطابقة لسياسة الحجم والأبعاد (الحد الأقصى 5 صور)</span>
                              </div>

                              {/* Simulated Preloaded Compliant Mockup Images to ease demonstration */}
                              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 space-y-1.5 mt-2">
                                <span className="text-[10px] text-indigo-700 font-black block text-right">💡 أضف عينات صور جاهزة ومطابقة للمواصفات والأبعاد (لتسريع التجربة والتحقق):</span>
                                <div className="flex flex-wrap gap-2 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (serviceWizData.images.length >= 5) {
                                        showNotification('warning', 'لقد وصلت للحد الأقصى 5 صور!');
                                        return;
                                      }
                                      const mockImg = {
                                        name: 'hospitality_premium.jpg',
                                        size: 245000,
                                        preview: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1280&h=720&fit=crop',
                                        width: 1280,
                                        height: 720
                                      };
                                      setServiceWizData(prev => ({ ...prev, images: [...prev.images, mockImg] }));
                                      showNotification('success', 'تم إلحاق صورة ضيافة عينة متوافقة بنسبة 16:9 مع الأبعاد والوزن!');
                                    }}
                                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[9px] font-black text-slate-700 cursor-pointer shadow-sm"
                                  >
                                    + صورة بوفيه ضيافة (1280x720)
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (serviceWizData.images.length >= 5) {
                                        showNotification('warning', 'لقد وصلت للحد الأقصى 5 صور!');
                                        return;
                                      }
                                      const mockImg = {
                                        name: 'wedding_decor.jpg',
                                        size: 312000,
                                        preview: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?q=80&w=1280&h=720&fit=crop',
                                        width: 1280,
                                        height: 720
                                      };
                                      setServiceWizData(prev => ({ ...prev, images: [...prev.images, mockImg] }));
                                      showNotification('success', 'تم إلحاق صورة كوشة عينة متوافقة بنسبة 16:9 مع الأبعاد والوزن!');
                                    }}
                                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[9px] font-black text-slate-700 cursor-pointer shadow-sm"
                                  >
                                    + صورة ديكور وكوشة (1280x720)
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (serviceWizData.images.length >= 5) {
                                        showNotification('warning', 'لقد وصلت للحد الأقصى 5 صور!');
                                        return;
                                      }
                                      const mockImg = {
                                        name: 'pro_photography.jpg',
                                        size: 182000,
                                        preview: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1280&h=720&fit=crop',
                                        width: 1280,
                                        height: 720
                                      };
                                      setServiceWizData(prev => ({ ...prev, images: [...prev.images, mockImg] }));
                                      showNotification('success', 'تم إلحاق صورة تصوير عينة متوافقة بنسبة 16:9 مع الأبعاد والوزن!');
                                    }}
                                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[9px] font-black text-slate-700 cursor-pointer shadow-sm"
                                  >
                                    + صورة كاميرا وتصوير (1280x720)
                                  </button>
                                </div>
                              </div>

                              {/* Thumbnail Previews with close button and dimensions tags */}
                              {serviceWizData.images.length > 0 && (
                                <div className="grid grid-cols-5 gap-2.5 pt-2">
                                  {serviceWizData.images.map((img, idx) => (
                                    <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group shadow-sm">
                                      <img src={img.preview} alt={img.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                      {/* Specs tag overlay */}
                                      <div className="absolute inset-x-0 bottom-0 bg-slate-900/70 p-1 text-[7px] text-center text-white leading-none truncate font-mono">
                                        {img.width}x{img.height} | {Math.round(img.size / 1024)}KB
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setServiceWizData(prev => ({
                                            ...prev,
                                            images: prev.images.filter((_, i) => i !== idx)
                                          }));
                                          showNotification('info', `تم إزالة الصورة ${img.name} من الألبوم.`);
                                        }}
                                        className="absolute top-1 left-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow transition-all cursor-pointer"
                                        title="حذف الصورة"
                                      >
                                        <X className="w-2 h-2" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Terms and Conditions */}
                            <div className="space-y-1">
                              <label className="text-[11px] font-black text-slate-600 block text-right">شروط وأحكام استخدام الخدمة وقوانين الحجز *</label>
                              <textarea
                                value={serviceWizData.terms}
                                onChange={(e) => setServiceWizData({ ...serviceWizData, terms: e.target.value })}
                                rows={2}
                                placeholder="أدخل هنا الشروط الإلزامية التي يوافق عليها العميل قبل الدفع، مثل متطلبات الطاقة، النظافة، أو التراخيص الأمنية..."
                                className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right text-slate-700 focus:border-purple-500 transition-all leading-relaxed font-bold"
                              />
                            </div>

                            {/* Service Status (Provider Control) */}
                            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex justify-between items-center">
                              <div className="text-right">
                                <span className="text-xs font-black text-slate-800 block">حالة الخدمة التشغيلية (خاص بالمزود) *</span>
                                <span className="text-[10px] text-slate-500 block">يتحكم المزود بتوافر الخدمة الفوري بالمنصة (نشطة أو غير نشطة مؤقتاً).</span>
                              </div>
                              <div>
                                <select
                                  value={serviceWizData.serviceStatus}
                                  onChange={(e) => setServiceWizData({ ...serviceWizData, serviceStatus: e.target.value })}
                                  className="p-2 border border-slate-200 bg-slate-50 rounded-xl text-xs font-bold outline-none text-right text-slate-700 focus:border-purple-500 cursor-pointer"
                                >
                                  <option value="نشط">نشطة ومتاحة للعملاء للطلب</option>
                                  <option value="غير نشط">غير نشطة (مغلقة مؤقتاً لأعمال التطوير)</option>
                                </select>
                              </div>
                            </div>

                          </motion.div>
                        )}

                        {/* Step 5: Complete Bento-Grid Review & Administrative Approval (Admin Role Only) */}
                        {serviceWizStep === 5 && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            
                            {/* Governance Warning Badge */}
                            <div className="bg-amber-50 text-amber-900 p-4 rounded-2xl text-[11px] leading-relaxed border border-amber-200/70 space-y-1">
                              <div className="flex items-center gap-1.5 font-black text-amber-950">
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>⚠️ إشعار تدقيق وحوكمة الجودة بالمنصة (شروط الاعتماد):</span>
                              </div>
                              <p className="pr-5 font-bold">
                                بموجب شروط الجودة وقاعدة 6، لن تظهر أي خدمة مستقلة أو مساندة مضافة حديثاً للعموم أو في البحث العام للعملاء حتى تخضع لحالة **(معتمد من الإدارة)**.
                              </p>
                            </div>

                            {/* Bento Summary Sheet */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 text-xs font-bold text-slate-700">
                              <div className="flex justify-between items-center border-b pb-2">
                                <span className="text-[9px] font-mono font-black text-slate-400">INTEGRATED PROVIDER DATA SHEET</span>
                                <h5 className="text-sm font-black text-slate-800">بطاقة المراجعة الفنية الشاملة للخدمة</h5>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                                <div className="space-y-1.5">
                                  <div>• الاسم التجاري: <span className="text-slate-900 font-black">{serviceWizData.name || 'لم يحدد'}</span></div>
                                  <div>• الفئة والتصنيف: <span className="text-slate-900 font-black">{serviceWizData.category}</span></div>
                                  <div>• المزود المالك: <span className="text-indigo-700 font-black">{serviceWizData.provider}</span></div>
                                  <div>• سياسة التنفيذ: <span className="text-purple-700 font-black">{serviceWizData.fulfillmentPolicy === 'Hybrid' ? 'هجين (Co-fulfillment/Hybrid)' : 'داخلي بالكامل (Internal)'}</span></div>
                                  <div>• سعر الوحدة القياسي: <span className="text-slate-900 font-mono font-black">{serviceWizData.unitPrice} ر.س لكل {serviceWizData.unit}</span></div>
                                  <div>• مخزون السعة اليومي: <span className="text-slate-900 font-mono font-black">{serviceWizData.dailyStock} طلبات يومياً</span></div>
                                </div>

                                <div className="space-y-1.5 border-r border-slate-100 pr-4">
                                  <div>• القيمة المالية للمخزون: <span className="text-emerald-700 font-mono font-black">{((Number(serviceWizData.unitPrice) || 0) * (Number(serviceWizData.dailyStock) || 0)).toLocaleString()} ر.س</span></div>
                                  <div>• سياسة الإلغاء المجاني: <span className="text-amber-800 font-black">{serviceWizData.cancellationPeriod}</span></div>
                                  <div>• التغطية الجغرافية: <span className="text-slate-900 font-black">{serviceWizData.coverageRegions.join('، ') || 'لم تحدد'}</span></div>
                                  <div>• المدن المشمولة بالتغطية: <span className="text-indigo-700 font-black">{serviceWizData.coverageCities.join('، ') || 'لم تحدد'}</span></div>
                                  <div>• حالة الخدمة (المزود): <span className="text-slate-950 font-black">{serviceWizData.serviceStatus === 'نشط' ? 'نشطة ومتاحة للطلب' : 'غير نشطة مؤقتاً'}</span></div>
                                  <div>• ألبوم الصور المرفقة: <span className="text-purple-700 font-black font-mono">{serviceWizData.images.length} صور مضافة</span></div>
                                </div>
                              </div>

                              <div className="pt-2.5 border-t border-slate-100 space-y-1">
                                <span className="text-slate-500 block text-[10px] text-right">📄 شروط وأحكام الخدمة للعميل:</span>
                                <p className="text-[11px] text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-150 leading-relaxed font-normal text-right">
                                  {serviceWizData.terms || 'لا يوجد شروط مسجلة.'}
                                </p>
                              </div>
                            </div>

                            {/* ADMINISTRATIVE APPROVAL STATUS SECTION (Admin Role Only, Strict Compliance) */}
                            <div className="bg-indigo-950 text-white p-5 rounded-2xl border border-indigo-900 space-y-3">
                              <div className="flex justify-between items-center border-b border-indigo-900 pb-2">
                                <span className="text-[9px] font-mono font-black text-indigo-300">ADMINISTRATIVE STATUS CONTROL ENGINE</span>
                                <span className="text-[10px] bg-indigo-800 text-indigo-100 px-2.5 py-0.5 rounded-md font-black">حساب الإدارة والموافقة</span>
                              </div>

                              <p className="text-[10px] text-indigo-200 leading-relaxed text-right">
                                بموجب قوانين الاعتماد، فإن صلاحية تعيين واعتماد ونشر الخدمات المستقلة بشكل عام تنحصر فقط في **صلاحية الإدارة (Admin)**. 
                              </p>

                              <div className="space-y-1.5 text-right">
                                <label className="text-[11px] font-black text-indigo-100 block">تحديث الحالة الإدارية للخدمة (للإدارة فقط):</label>
                                {serviceWizRole === 'admin' ? (
                                  <select
                                    value={serviceWizData.adminStatus}
                                    onChange={(e) => setServiceWizData({ ...serviceWizData, adminStatus: e.target.value })}
                                    className="w-full p-2.5 border border-indigo-700 bg-indigo-900 text-white rounded-xl text-xs font-black outline-none text-right focus:border-indigo-500 cursor-pointer"
                                  >
                                    <option value="معلق بانتظار الاعتماد">معلق بانتظار الاعتماد (Pending Approval)</option>
                                    <option value="معتمد من الإدارة">معتمد من الإدارة ونشر للجمهور (Approved & Published)</option>
                                    <option value="مرفوض">مرفوض لعدم استيفاء شروط الجودة (Rejected)</option>
                                  </select>
                                ) : (
                                  <div className="w-full p-2.5 bg-indigo-900/60 border border-indigo-800 rounded-xl text-xs font-black text-indigo-200 text-right cursor-not-allowed">
                                    {serviceWizData.adminStatus} (مغلق لشركاء الخدمة - يتطلب مراجعة من الإدارة)
                                  </div>
                                )}
                                <span className="text-[9px] text-indigo-300 block text-right mt-1 leading-relaxed">
                                  {serviceWizRole === 'admin'
                                    ? '🟢 بصفتك مديراً للنظام، يمكنك تعيين الحالة كـ (معتمد) لتنشر فوراً للعملاء، أو (مرفوض) مع توضيح السبب.'
                                    : '🔒 لا يمتلك شريك الخدمة (المزود) الصلاحيات لتعديل هذا الحقل، وتظل الحالة معلقة لحين الموافقة الرسمية.'}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* Wizard Navigation Footer */}
                        <div className="flex justify-between items-center pt-4 border-t border-slate-200 font-sans">
                          <div>
                            {serviceWizStep > 1 && (
                              <button
                                type="button"
                                onClick={() => setServiceWizStep(serviceWizStep - 1)}
                                className="px-4 py-2 text-slate-600 bg-white hover:bg-slate-100 rounded-xl text-xs font-black cursor-pointer border border-slate-250 transition-all flex items-center gap-1 shadow-sm"
                              >
                                السابق
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {serviceWizStep < 5 ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (serviceWizStep === 1 && !serviceWizData.name.trim()) {
                                    showNotification('warning', 'يرجى إدخال اسم الخدمة التجاري أولاً للمتابعة.');
                                    return;
                                  }
                                  if (serviceWizStep === 3 && serviceWizData.coverageRegions.length === 0) {
                                    showNotification('warning', 'يرجى اختيار منطقة تغطية واحدة على الأقل.');
                                    return;
                                  }
                                  if (serviceWizStep === 3 && serviceWizData.coverageCities.length === 0) {
                                    showNotification('warning', 'يرجى تحديد مدينة مخدومة واحدة على الأقل.');
                                    return;
                                  }
                                  setServiceWizStep(serviceWizStep + 1);
                                }}
                                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black cursor-pointer transition-all shadow-md"
                              >
                                التالي
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  const newIdNum = catalogServices.length + 1;
                                  const newId = `SER-26-${String(newIdNum).padStart(8, '0')}`;
                                  
                                  const newSerObj = {
                                    id: newId,
                                    name: serviceWizData.name,
                                    category: serviceWizData.category,
                                    provider: serviceWizData.provider,
                                    price: parseInt(serviceWizData.unitPrice),
                                    unitPrice: parseInt(serviceWizData.unitPrice),
                                    unit: serviceWizData.unit,
                                    dailyStock: parseInt(serviceWizData.dailyStock),
                                    cancellationPeriod: serviceWizData.cancellationPeriod,
                                    coverageRegions: serviceWizData.coverageRegions,
                                    coverageCities: serviceWizData.coverageCities,
                                    status: serviceWizData.adminStatus, // Rule 6
                                    serviceStatus: serviceWizData.serviceStatus,
                                    fulfillmentPolicy: serviceWizData.fulfillmentPolicy,
                                    terms: serviceWizData.terms,
                                    images: serviceWizData.images, // Array of images
                                    desc: serviceWizData.desc || 'خدمة مساندة جديدة خاضعة لشروط الجودة والمراجعة.'
                                  };

                                  setCatalogServices([...catalogServices, newSerObj]);
                                  setServiceWizStep(1); // Reset
                                  setServiceWizData({
                                    name: '',
                                    category: 'ضيافة',
                                    provider: currentProviderName || 'ليالينا للضيافة والاحتفالات',
                                    desc: '',
                                    unitPrice: '150',
                                    unit: 'ساعة',
                                    dailyStock: '5',
                                    cancellationPeriod: '٤٨ ساعة قبل موعد الفعالية',
                                    coverageRegions: ['منطقة الرياض'],
                                    coverageCities: ['الرياض'],
                                    adminStatus: 'معلق بانتظار الاعتماد',
                                    serviceStatus: 'نشط',
                                    terms: 'يلتزم العميل بتوفير متطلبات التشغيل المتفق عليها. تخضع عمليات الإلغاء لسياسة الاسترداد والمهلة المحددة.',
                                    images: [],
                                    fulfillmentPolicy: 'Internal',
                                    dynamicWeekend: true,
                                    dynamicSeasonal: false,
                                    dynamicVolume: false,
                                  });

                                  showNotification('success', `تم تسجيل تقديم الخدمة ${newId} بنجاح! الحالة الحالية: (${newSerObj.status}) بموجب شروط وقواعد الاعتماد والاعتماد المتعدد.`);
                                }}
                                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-md transition-all flex items-center gap-1.5"
                              >
                                <Check className="w-4 h-4" />
                                تدشين وتقديم الخدمة للكتالوج
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
  );
};
