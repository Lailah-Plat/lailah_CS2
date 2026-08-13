import React, { useState } from 'react';
import { 
  Settings2, X, ShieldCheck, BadgePercent, ScrollText, Sparkles, 
  Users2, ChevronDown, Clock, Coins, Layers, Box, Activity, Globe, MapPin, UploadCloud, Info, Video
} from 'lucide-react';
import { validateHallOrServiceImage, validateHallOrServiceVideo } from '../../utils/mediaValidator';
import { MediaDimensionsHelperModal } from '../common/MediaDimensionsHelperModal';

interface ServiceModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: any;
  serviceForm: any;
  setServiceForm: React.Dispatch<React.SetStateAction<any>>;
  activeServiceTab: 'basic' | 'pricing' | 'terms';
  setActiveServiceTab: React.Dispatch<React.SetStateAction<'basic' | 'pricing' | 'terms'>>;
  providers: any[];
  regions: any[];
  currentUserName: string;
  services: any[];
  setServices: React.Dispatch<React.SetStateAction<any[]>>;
  showNotification: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export const ServiceModalForm: React.FC<ServiceModalFormProps> = ({
  isOpen,
  onClose,
  editingItem,
  serviceForm,
  setServiceForm,
  activeServiceTab,
  setActiveServiceTab,
  providers,
  regions,
  currentUserName,
  services,
  setServices,
  showNotification
}) => {
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [showMediaGuideModal, setShowMediaGuideModal] = useState(false);

  // Check if selected provider has dynamic pricing active
  const providerHasDynamicPricing = React.useMemo(() => {
    if (!serviceForm?.provider) return false;
    const p = providers.find(prov => prov.name === serviceForm.provider);
    if (!p) return false;
    const packageName = (p.packageName || '').toLowerCase();
    const isPremiumPackage = packageName.includes('pro') || packageName.includes('احترافية') || packageName.includes('premium') || packageName.includes('متقدمة');
    const hasAddon = p.addons?.includes('dynamic_pricing') || p.includesDynamicPricing || p.subscriptionStatus === 'Active';
    return isPremiumPackage || hasAddon;
  }, [serviceForm?.provider, providers]);

  // Selected regions and cities arrays for dynamic filtering
  const selectedRegions = React.useMemo(() => {
    return (serviceForm?.regions || '').split('،').map((s: string) => s.trim()).filter(Boolean);
  }, [serviceForm?.regions]);

  const availableCities = React.useMemo(() => {
    return regions
      .filter(r => selectedRegions.includes(r.name))
      .flatMap(r => r.cities || []);
  }, [regions, selectedRegions]);

  const selectedCities = React.useMemo(() => {
    return (serviceForm?.cities || '').split('،').map((c: string) => c.trim()).filter(Boolean);
  }, [serviceForm?.cities]);

  // Helper to get normalized images array
  let serviceImages: any[] = [];
  if (serviceForm && serviceForm.images) {
    if (Array.isArray(serviceForm.images)) {
      serviceImages = serviceForm.images;
    } else if (typeof serviceForm.images === 'string') {
      try {
        const parsed = JSON.parse(serviceForm.images);
        if (Array.isArray(parsed)) {
          serviceImages = parsed;
        }
      } catch (e) {
        if (serviceForm.images.trim()) {
          serviceImages = [{ name: 'Image', preview: serviceForm.images.trim() }];
        }
      }
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col md:max-h-[580px] h-full max-h-[92vh] relative" dir="rtl">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-50/50 to-slate-50 p-4 border-b border-slate-150 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100/80 rounded-xl flex items-center justify-center text-purple-700 shadow-sm border border-purple-200/50">
              <Settings2 className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                {editingItem ? 'إعادة ضبط وإدارة تفاصيل الخدمة المضافة' : 'إطلاق وتدشين خدمة تكميلية جديدة'}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] font-extrabold text-purple-700 bg-purple-100/60 px-1.5 py-0.5 rounded-full uppercase leading-none">إدارة مستقرة بامتياز</span>
                <span className="text-[10px] text-slate-400">التحديث يسري فوريًا في محركات الحجز والمناطق المستهدفة</span>
              </div>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="bg-white text-slate-450 hover:text-red-500 hover:bg-red-50 border border-slate-150 p-2 rounded-full transition-all cursor-pointer shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper Header Navigation Tabs */}
        <div className="px-5 bg-slate-50/40 border-b border-slate-150 flex items-center justify-around gap-1 shrink-0 min-h-12 scrollbar-none">
          <button 
            type="button"
            onClick={() => setActiveServiceTab('basic')} 
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all duration-200 cursor-pointer ${activeServiceTab === 'basic' ? 'border-purple-600 text-purple-700 font-extrabold bg-purple-50/30' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <div className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${activeServiceTab === 'basic' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'}`}>١</div>
            <ShieldCheck className="w-4 h-4" />
            المعلومات التأسيسية
          </button>
          <button 
            type="button"
            onClick={() => {
              if (!serviceForm.name || !serviceForm.provider) {
                alert("الرجاء إكمال خطوات التأسيس أولاً وتسمية الخدمة");
                return;
              }
              setActiveServiceTab('pricing');
            }} 
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all duration-200 cursor-pointer ${activeServiceTab === 'pricing' ? 'border-purple-600 text-purple-700 font-extrabold bg-purple-50/30' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <div className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${activeServiceTab === 'pricing' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'}`}>٢</div>
            <BadgePercent className="w-4 h-4" />
            التسعير ونطاق الفعالية
          </button>
          <button 
            type="button"
            onClick={() => {
              if (!serviceForm.name || !serviceForm.provider) {
                alert("الرجاء إكمال خطوات التأسيس أولاً وتسمية الخدمة");
                return;
              }
              setActiveServiceTab('terms');
            }} 
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all duration-200 cursor-pointer ${activeServiceTab === 'terms' ? 'border-purple-600 text-purple-700 font-extrabold bg-purple-50/30' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <div className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${activeServiceTab === 'terms' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'}`}>٣</div>
            <ScrollText className="w-4 h-4" />
            الأحكام وألبوم الصور
          </button>
        </div>
        
        {/* Tab Contents Frame */}
        <div className="p-6 flex-1 bg-white overflow-y-auto flex flex-col justify-start">
          
          {/* Tab 1: Basic Info */}
          {activeServiceTab === 'basic' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in slide-in-from-right-3 duration-200">
              
              {/* Right Column: Key details */}
              <div className="md:col-span-7 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                    اسم وتوصيف الخدمة المساندة <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={serviceForm.name || ''} 
                      onChange={e => setServiceForm({...serviceForm, name: e.target.value})} 
                      className="w-full pl-3 pr-9 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none bg-slate-50/30 hover:bg-white transition-all font-semibold text-slate-800" 
                      placeholder="بوفيه ملكي، تنظيم ممر، كوشة عرايس..." 
                    />
                    <Sparkles className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                    المزود والمسؤول عن التنفيذ الخدمي <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select 
                      value={serviceForm.provider || ''} 
                      onChange={e => setServiceForm({...serviceForm, provider: e.target.value})} 
                      className="w-full pl-3 pr-9 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/30 hover:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none font-semibold text-slate-800 appearance-none cursor-pointer font-sans"
                    >
                      <option value="">اختر من قائمة المزودين المسجلين...</option>
                      {providers.map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Users2 className="w-4 h-4" />
                    </div>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                    تصنيف الخدمات المستقلة <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select 
                      value={serviceForm.classification || ''} 
                      onChange={e => setServiceForm({...serviceForm, classification: e.target.value})} 
                      className="w-full pl-3 pr-9 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/30 hover:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none font-semibold text-slate-800 appearance-none cursor-pointer font-sans"
                    >
                      <option value="">-- اختر التصنيف اللوجستي --</option>
                      {(() => {
                        try {
                          const stored = localStorage.getItem('SYSTEM_DATastore_serviceCategories');
                          return stored ? JSON.parse(stored) as string[] : ['ضيافة وبوفيهات', 'تصوير وتوثيق', 'ديكور وتنسيق زهور', 'إضاءات وصوتيات', 'تنظيم زفات', 'أخرى'];
                        } catch {
                          return ['ضيافة وبوفيهات', 'تصوير وتوثيق', 'ديكور وتنسيق زهور', 'إضاءات وصوتيات', 'تنظيم زفات', 'أخرى'];
                        }
                      })().map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5 justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                      المهلة الممنوحة للإلغاء المجاني للخدمة
                    </div>
                    <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200/60 px-2 py-0.5 rounded-full font-bold">بوابة أمان الحجز</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={serviceForm.cancellationPeriod === null ? '' : serviceForm.cancellationPeriod} 
                      onChange={e => setServiceForm({...serviceForm, cancellationPeriod: e.target.value === '' ? null : Number(e.target.value)})} 
                      className="w-full pl-12 pr-9 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none bg-slate-50/30 hover:bg-white transition-all font-mono text-left font-bold text-slate-800" 
                      placeholder="اتركه فارغاً لاعتماده نهائيًا ولا يقبل الإلغاء" 
                    />
                    <Clock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 font-sans">أيام</span>
                  </div>
                </div>
              </div>

              {/* Left Column: Multi-line description */}
              <div className="md:col-span-5 h-[230px] flex flex-col justify-between">
                <div className="flex-1 flex flex-col">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">الشرح التوضيحي للخدمة للعميل</label>
                  <textarea 
                    value={serviceForm.description || ''} 
                    onChange={e => setServiceForm({...serviceForm, description: e.target.value})} 
                    className="w-full flex-1 p-3 text-xs rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none bg-slate-50/30 hover:bg-white transition-all font-medium text-slate-800 resize-none leading-relaxed h-full min-h-[175px]" 
                    placeholder="صف بالتفصيل ما تحتويه الخدمة مع أعداد الكادر المسؤول والتجهيزات والمكونات بدقة فائقة لمنع ادعاءات عدم المطابقة وحسم الخلافات الميدانية..." 
                  />
                </div>
                <div className="text-[10px] text-purple-650 font-medium flex items-center gap-1 bg-purple-50/50 p-2 rounded-lg border border-purple-100/50 mt-2">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  البيانات التفصيلية تعزز ثقة العميل وتزيد الحجوزات بنسبة 60%
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Pricing & Scope */}
          {activeServiceTab === 'pricing' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in slide-in-from-right-3 duration-200">
              
              {/* Right Column: Financial & State properties */}
              <div className="md:col-span-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">سعر الوحدة للخدمة <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={serviceForm.unitPrice || ''} 
                        onChange={e => setServiceForm({...serviceForm, unitPrice: Number(e.target.value)})} 
                        className="w-full pl-9 pr-8 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none bg-slate-50/30 hover:bg-white transition-all font-mono text-left font-bold text-slate-800" 
                        placeholder="0.00" 
                      />
                      <Coins className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-extrabold text-slate-450">ر.س</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">الوحدة القياسية للخدمة</label>
                    <div className="relative">
                      <select 
                        value={serviceForm.unit || ''} 
                        onChange={e => setServiceForm({...serviceForm, unit: e.target.value})} 
                        className="w-full pl-3 pr-8 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none bg-white hover:bg-white transition-all font-bold text-slate-800 cursor-pointer appearance-none font-sans"
                      >
                        <option value="">اختر الوحدة</option>
                        {(() => {
                          try {
                            const stored = localStorage.getItem('SYSTEM_DATastore_units');
                            return stored ? JSON.parse(stored) as string[] : ['مرة واحدة', 'شخص', 'ساعة', 'يوم', 'حزمة', 'وجبة', 'كيلو'];
                          } catch {
                            return ['مرة واحدة', 'شخص', 'ساعة', 'يوم', 'حزمة', 'وجبة', 'كيلو'];
                          }
                        })().map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                      <Layers className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">الرسوم الإجمالية للباقة <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={serviceForm.price || ''} 
                        onChange={e => setServiceForm({...serviceForm, price: Number(e.target.value)})} 
                        className="w-full pl-9 pr-8 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none bg-slate-50/30 hover:bg-white transition-all font-mono text-left font-bold text-slate-800" 
                        placeholder="0.00" 
                      />
                      <Coins className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-extrabold text-slate-450">ر.س</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 font-sans">كمية المخزون اليومية</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={serviceForm.quantity === null ? '' : serviceForm.quantity} 
                        onChange={e => setServiceForm({...serviceForm, quantity: e.target.value === '' ? null : Number(e.target.value)})} 
                        className="w-full pl-3 pr-8 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none bg-slate-50/30 hover:bg-white transition-all font-mono text-left font-bold text-slate-800" 
                        placeholder="غير محدودة" 
                      />
                      <Box className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 font-sans">حالة نشاط الخدمة</label>
                    <div className="relative font-sans">
                      <select 
                        value={serviceForm.serviceStatus || 'نشط'} 
                        onChange={e => setServiceForm({...serviceForm, serviceStatus: e.target.value})} 
                        className="w-full pl-3 pr-8 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/30 hover:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none font-bold text-slate-800 appearance-none cursor-pointer"
                      >
                        <option value="نشط">نشطة للحجز</option>
                        <option value="معلق">معلقة مؤقتاً</option>
                      </select>
                      <Activity className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 font-sans font-semibold">الحالة الرقابية للإدارة</label>
                    <div className="relative font-sans">
                      <select 
                        value={serviceForm.adminStatus || 'فعالة'} 
                        onChange={e => setServiceForm({...serviceForm, adminStatus: e.target.value})} 
                        className="w-full pl-3 pr-8 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/30 hover:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none font-bold text-slate-800 appearance-none cursor-pointer"
                      >
                        <option value="فعالة">فعالة بالمنظومة</option>
                        <option value="محظورة">محظورة وموقوفة</option>
                      </select>
                      <ShieldCheck className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* التسعير الديناميكي والذكاء التشغيلي */}
                <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
                      التسعير الديناميكي والذكاء التشغيلي
                    </span>
                    <span className="text-[9px] bg-purple-50 text-purple-750 font-bold px-2 py-0.5 rounded-full border border-purple-100">
                      ميزة ذكية
                    </span>
                  </div>

                  {!providerHasDynamicPricing ? (
                    <div className="p-2.5 bg-amber-50/50 border border-amber-200/60 rounded-xl flex items-start gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 mt-0.5 text-xs font-bold">
                        🔒
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-black text-amber-900 block">الميزة مغلقة (يتطلب ترقية الباقة)</span>
                        <p className="text-[9px] text-amber-750 leading-relaxed font-semibold">
                          يتوفر "التسعير الديناميكي والذكاء التشغيلي" كجزء من الباقة الاحترافية أو من خلال شرائها كميزة إضافية للباقات.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-1 bg-purple-50/20 rounded-lg px-2">
                        <span className="text-[10px] font-bold text-slate-700">تفعيل التسعير التلقائي في أوقات الذروة والمواسم</span>
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={!!serviceForm.isDynamicPricingEnabled}
                            onChange={(e) => setServiceForm({ ...serviceForm, isDynamicPricingEnabled: e.target.checked })}
                            className="sr-only peer" 
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:-left-1 after:content-[''] after:absolute after:top-[4px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-purple-600" />
                        </label>
                      </div>

                      {!!serviceForm.isDynamicPricingEnabled && (
                        <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-1.5 duration-200">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">نسبة زيادة الذروة / العطلات</label>
                            <div className="relative">
                              <input 
                                type="number" 
                                value={serviceForm.surgePercentage === undefined ? '' : serviceForm.surgePercentage}
                                onChange={(e) => setServiceForm({ ...serviceForm, surgePercentage: e.target.value === '' ? '' : Number(e.target.value) })}
                                className="w-full pl-6 pr-3 py-1.5 text-[10px] rounded-lg border border-slate-200 font-mono font-bold text-slate-800"
                                placeholder="15"
                              />
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-bold">%</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">نسبة خصم أوقات الركود</label>
                            <div className="relative">
                              <input 
                                type="number" 
                                value={serviceForm.discountPercentage === undefined ? '' : serviceForm.discountPercentage}
                                onChange={(e) => setServiceForm({ ...serviceForm, discountPercentage: e.target.value === '' ? '' : Number(e.target.value) })}
                                className="w-full pl-6 pr-3 py-1.5 text-[10px] rounded-lg border border-slate-200 font-mono font-bold text-slate-800"
                                placeholder="10"
                              />
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-bold">%</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                    <BadgePercent className="w-4 h-4" />
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    <span className="font-bold text-slate-700 block mb-0.5">ضوابط الأسعار والمخازن</span>
                    يقوم محرّك التدقيق الخارجي باستبعاد ومراجعة أي خدمة تتخطى سقف التسعير الفئوي الموصى به للمناطق.
                  </p>
                </div>
              </div>

              {/* Left Column: Combined regions selection and dynamic cities selection lists */}
              <div className="md:col-span-6 flex flex-col gap-4 border border-slate-150 rounded-2xl p-4 bg-slate-50/40 min-h-[230px]">
                {/* Region Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-purple-600" />
                      المناطق المشمولة للخدمة
                    </span>
                    <span className="text-[10px] bg-purple-100 text-purple-800 font-extrabold px-2.5 py-0.5 rounded-full">
                      {selectedRegions.length} مناطق مغطاة
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-2 font-medium">حدد المناطق الإدارية المغطاة بالخدمة:</p>
                  
                  <div className="grid grid-cols-2 gap-1.5 max-h-[110px] overflow-y-auto p-1.5 bg-white border border-slate-200 rounded-xl scrollbar-none">
                    {regions.map((r) => {
                      const isSelected = selectedRegions.includes(r.name);
                      return (
                        <button
                          type="button"
                          key={r.id}
                          onClick={() => {
                            let current = [...selectedRegions];
                            if (isSelected) {
                              current = current.filter((x: string) => x !== r.name);
                              // Clear cities of the removed region to prevent stale data
                              const regionCities = r.cities || [];
                              const newCities = selectedCities.filter((c: string) => !regionCities.includes(c));
                              setServiceForm({
                                ...serviceForm,
                                regions: current.join('، '),
                                cities: newCities.join('، ')
                              });
                            } else {
                              current.push(r.name);
                              setServiceForm({
                                ...serviceForm,
                                regions: current.join('، ')
                              });
                            }
                          }}
                          className={`p-2 rounded-lg border text-center transition-all cursor-pointer font-bold flex items-center justify-center gap-1.5 focus:outline-none text-[10px] ${
                            isSelected 
                              ? 'bg-purple-600 border-purple-600 text-white shadow-sm' 
                              : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                          }`}
                        >
                          <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                          <span className="truncate">{r.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* City Selection (Dynamically shown based on selected regions) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-amber-500 animate-bounce-slow" />
                      المدن المخدومة التابعة للمنطقة
                    </span>
                    <span className="text-[10px] bg-amber-50 text-amber-700 font-extrabold px-2.5 py-0.5 rounded-full border border-amber-200/50">
                      {selectedCities.length} مدن مخدومة
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-2 font-medium">اختر المدن التي يقدم مزود الخدمة الخدمة بها:</p>

                  <div className="max-h-[120px] overflow-y-auto p-2 bg-white border border-slate-200 rounded-xl min-h-[60px] flex flex-wrap gap-1.5">
                    {selectedRegions.length === 0 ? (
                      <div className="w-full py-4 flex flex-col items-center justify-center text-center">
                        <Info className="w-4 h-4 text-slate-400 mb-1" />
                        <span className="text-[10px] text-slate-400 font-bold">يرجى تحديد منطقة تغطية واحدة على الأقل لعرض مدنها</span>
                      </div>
                    ) : (
                      availableCities.map((city: string) => {
                        const isCitySelected = selectedCities.includes(city);
                        return (
                          <button
                            key={city}
                            type="button"
                            onClick={() => {
                              const current = [...selectedCities];
                              if (isCitySelected) {
                                const updated = current.filter(c => c !== city);
                                setServiceForm({ ...serviceForm, cities: updated.join('، ') });
                              } else {
                                current.push(city);
                                setServiceForm({ ...serviceForm, cities: current.join('، ') });
                              }
                            }}
                            className={`px-2.5 py-1 rounded-lg border text-center text-[10px] font-bold transition-all ${
                              isCitySelected
                                ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {city}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Terms & Media */}
          {activeServiceTab === 'terms' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in slide-in-from-right-3 duration-200">
              
              {/* Right Column: Terms of utilization */}
              <div className="md:col-span-6 flex flex-col justify-between">
                <div className="flex-1 flex flex-col">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                    شروط وأحكام استخدام الخدمة
                  </label>
                  <textarea 
                    value={serviceForm.terms || ''} 
                    onChange={e => setServiceForm({...serviceForm, terms: e.target.value})} 
                    className="w-full flex-1 p-3 text-xs rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none bg-slate-50/30 hover:bg-white transition-all font-medium text-slate-800 resize-none leading-relaxed h-full min-h-[155px]" 
                    placeholder="اكتب البنود والشروط منفردة؛ كل بند في سطر مستقل لتنسيقها وعرضها بوضوح تام...&#10;مثال:&#10;- الخدمة مهيأة ومخصصة للمجمعات المغلقة وصالات الأفراح.&#10;- يلزم طلب الحجز قبل 3 أيام للترتيب." 
                  />
                </div>
                <div className="text-[9px] text-slate-400 flex items-center gap-1.5 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <ScrollText className="w-4 h-4 text-purple-600 shrink-0" />
                  توقيع الشروط يضمن إلزامية التنفيذ وتفادي المشاكل التعاقدية.
                </div>
              </div>

              {/* Left Column: Drag & Drop Album, Video & Previews */}
              <div className="md:col-span-6 flex flex-col gap-3 min-h-[230px]">
                <div>
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                      ألبوم صور الخدمة <span className="text-slate-400 font-normal">(حد أقصى 5 صور)</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowMediaGuideModal(true)}
                        className="text-[9px] bg-purple-500/10 text-purple-700 hover:bg-purple-500/20 px-2 py-0.5 rounded-full font-bold border border-purple-500/30 transition-all cursor-pointer"
                      >
                        📱 دليل التصوير الأفقي (16:9)
                      </button>
                      <span className="text-[9px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-semibold border border-purple-200/60">
                        500KB | 16:9
                      </span>
                    </div>
                  </div>
                  
                  <div className="border-2 border-dashed border-purple-200 bg-purple-50/10 hover:border-purple-400 rounded-xl p-3 text-center transition-all relative hover:bg-purple-50/25 cursor-pointer flex flex-col justify-center items-center">
                    <input 
                      type="file" 
                      multiple 
                      accept="image/jpeg,image/png,image/webp,image/jpg" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      disabled={isImageUploading}
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []) as File[];
                        if (serviceImages.length + files.length > 5) {
                          alert('الحد الأقصى المسموح به هو 5 صور للخدمة الواحدة');
                          return;
                        }
                        setIsImageUploading(true);
                        try {
                          const uploadedList = [];
                          for (const file of files) {
                            const valResult = await validateHallOrServiceImage(file);
                            if (!valResult.valid) {
                              alert(`تنبيه رفض رفع الصورة (${file.name}):\n${valResult.error}`);
                              continue;
                            }
                            if (valResult.warning) {
                              showNotification('warning', valResult.warning);
                            }

                            const formData = new FormData();
                            formData.append('image', file);
                            const res = await fetch('/api/upload', {
                              method: 'POST',
                              body: formData
                            });
                            if (res.ok) {
                              const data = await res.json();
                              if (data && data.url) {
                                uploadedList.push({ name: file.name, preview: data.url });
                              }
                            }
                          }
                          if (uploadedList.length > 0) {
                            setServiceForm({
                              ...serviceForm,
                              images: [...serviceImages, ...uploadedList]
                            });
                          }
                        } catch (uploadErr) {
                          console.error('Failed upload:', uploadErr);
                          alert('فشل رفع بعض أو كل الصور المحددة إلى الخادم.');
                        } finally {
                          setIsImageUploading(false);
                        }
                      }} 
                    />
                    <UploadCloud className="w-5 h-5 text-purple-500 mb-0.5 animate-pulse" />
                    <p className="text-[11px] font-bold text-slate-700">
                      {isImageUploading ? 'جاري الفحص والرفع...' : 'اسحب الصور أو تصفح من جهازك'}
                    </p>
                    <p className="text-[9px] text-slate-450 mt-0.5 font-medium">JPEG, PNG, WebP بسعة 500KB بحد أقصى (16:9 مفضل)</p>
                  </div>
                </div>

                {/* Previews Thumbnails frame */}
                <div className="min-h-[50px] flex items-center justify-center">
                  {serviceImages.length > 0 ? (
                    <div className="grid grid-cols-5 gap-2 w-full bg-slate-50 border border-slate-150 p-1.5 rounded-xl">
                      {serviceImages.map((img: any, i: number) => (
                        <div key={i} className="relative aspect-square bg-white rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center text-center shadow-sm group">
                          {img.preview ? (
                            <img src={img.preview} alt={img.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="text-[7px] text-slate-500 px-1 truncate" dir="ltr">{img.name || 'Image'}</span>
                          )}
                          {i === 0 && (
                            <div className="absolute bottom-0 inset-x-0 bg-purple-600 text-white font-extrabold text-[7px] text-center py-0.5 leading-none">
                              الغلاف
                            </div>
                          )}
                          <button 
                            type="button"
                            onClick={() => setServiceForm({...serviceForm, images: serviceImages.filter((_: any, idx: number) => idx !== i)})} 
                            className="absolute top-0.5 left-0.5 bg-red-500 hover:bg-red-650 text-white p-0.5 rounded-full z-10 transition-all opacity-90 shadow cursor-pointer"
                          >
                            <X className="w-2 h-2" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 text-center italic">لا توجد صور مرفوعة حالياً للخدمة التكميلية.</p>
                  )}
                </div>

                {/* Video Upload Section according to Rule 7 */}
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <Video className="w-3.5 h-3.5 text-purple-600" />
                      مقطع فيديو للخدمة (اختياري)
                    </label>
                    <span className="text-[8px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                      MP4 | 10MB | max 960x540
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input 
                      type="text" 
                      value={serviceForm.videoUrl || ''} 
                      onChange={e => setServiceForm({ ...serviceForm, videoUrl: e.target.value })} 
                      placeholder="رابط فيديو MP4 أو ارفعه مباشرة..."
                      className="flex-1 text-[11px] p-2 rounded-lg border border-slate-200 bg-white focus:border-purple-500 outline-none font-mono"
                    />
                    <label className="bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold px-2.5 py-2 rounded-lg cursor-pointer transition-all flex items-center gap-1 shrink-0">
                      <UploadCloud className="w-3 h-3" />
                      <span>رفع</span>
                      <input 
                        type="file" 
                        accept="video/mp4" 
                        className="hidden" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          const valResult = await validateHallOrServiceVideo(file);
                          if (!valResult.valid) {
                            alert(`تنبيه رفض رفع الفيديو:\n${valResult.error}`);
                            return;
                          }

                          const formData = new FormData();
                          formData.append('file', file);
                          try {
                            showNotification('info', 'جاري رفع مقطع الفيديو...');
                            const res = await fetch('/api/upload', {
                              method: 'POST',
                              body: formData
                            });
                            if (res.ok) {
                              const data = await res.json();
                              if (data && data.url) {
                                setServiceForm((prev: any) => ({ ...prev, videoUrl: data.url }));
                                showNotification('success', 'تم رفع مقطع الفيديو للخدمة بنجاح');
                              }
                            } else {
                              throw new Error('فشل رفع الفيديو');
                            }
                          } catch (err: any) {
                            alert('خطأ أثناء رفع الفيديو: ' + err.message);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Stepper Footer with dynamic triggers */}
        <div className="p-4 bg-slate-50 border-t border-slate-150 flex items-center justify-between shrink-0">
          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200/80 hover:text-slate-800 rounded-xl transition-all"
            >
              إلغاء الإجراء
            </button>
            {activeServiceTab !== 'basic' && (
              <button
                type="button"
                onClick={() => {
                  if (activeServiceTab === 'terms') setActiveServiceTab('pricing');
                  else if (activeServiceTab === 'pricing') setActiveServiceTab('basic');
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-sm"
              >
                السابق
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {activeServiceTab !== 'terms' ? (
              <button
                type="button"
                onClick={() => {
                  if (activeServiceTab === 'basic' && (!serviceForm.name || !serviceForm.provider || !serviceForm.classification)) {
                    alert("الرجاء تعبئة اسم الخدمة، تحديد المزود، واختيار تصنيف الخدمة قبل إكمال الخطوات التالية");
                    return;
                  }
                  if (activeServiceTab === 'basic') setActiveServiceTab('pricing');
                  else if (activeServiceTab === 'pricing') setActiveServiceTab('terms');
                }}
                className="px-5 py-2 text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100/90 border border-purple-200/50 rounded-xl transition-all"
              >
                التالي
              </button>
            ) : null}

            <button 
              onClick={async () => {
                if (!serviceForm.name || !serviceForm.provider || !serviceForm.classification) {
                  setActiveServiceTab('basic');
                  setTimeout(() => alert("الرجاء تحديد واختيار اسم الخدمة، المزود، وتصنيف الخدمة أولًا"), 100);
                  return;
                }
                if (!serviceForm.regions) {
                  setActiveServiceTab('pricing');
                  setTimeout(() => alert("الرجاء تحديد نطاق التغطية والمناطق أولاً"), 100);
                  return;
                }
                const newServicePayload = {
                  name: serviceForm.name,
                  description: serviceForm.description || '',
                  provider: serviceForm.provider,
                  classification: serviceForm.classification,
                  category: serviceForm.classification, // Let's keep category in sync with classification as fallback!
                  quantity: serviceForm.quantity === '' ? null : Number(serviceForm.quantity),
                  price: Number(serviceForm.price) || 0,
                  regions: serviceForm.regions || '',
                  cities: serviceForm.cities || '',
                  terms: serviceForm.terms || '',
                  serviceStatus: serviceForm.serviceStatus || 'نشط',
                  adminStatus: serviceForm.adminStatus || 'فعالة',
                  cancellationPeriod: isNaN(parseInt(String(serviceForm.cancellationPeriod), 10)) ? null : parseInt(String(serviceForm.cancellationPeriod), 10),
                  hostName: serviceForm.hostName || currentUserName,
                  unit: serviceForm.unit || 'مرة واحدة',
                  unitPrice: Number(serviceForm.unitPrice) || 0,
                  isDynamicPricingEnabled: !!serviceForm.isDynamicPricingEnabled,
                  surgePercentage: serviceForm.surgePercentage === '' || serviceForm.surgePercentage === undefined ? null : Number(serviceForm.surgePercentage),
                  discountPercentage: serviceForm.discountPercentage === '' || serviceForm.discountPercentage === undefined ? null : Number(serviceForm.discountPercentage),
                  images: serviceImages
                };

                try {
                  let savedService;
                  if (editingItem) {
                    const isApproved = editingItem.status === 'approved' || editingItem.status === 'نشط' || editingItem.approved;
                    
                    if (isApproved) {
                      // Build diff map
                      const pendingChanges: Record<string, { label: string; oldVal: any; newVal: any }> = {};
                      if (editingItem.name !== newServicePayload.name) pendingChanges['name'] = { label: 'اسم الخدمة', oldVal: editingItem.name || 'الاسم السابق', newVal: newServicePayload.name };
                      if (Number(editingItem.price) !== Number(newServicePayload.price)) pendingChanges['price'] = { label: 'سعر الخدمة الأساسي', oldVal: `${editingItem.price || 0} ر.س`, newVal: `${newServicePayload.price || 0} ر.س` };
                      if (editingItem.category !== newServicePayload.category) pendingChanges['category'] = { label: 'تصنيف الخدمة', oldVal: editingItem.category || 'تصنيف سابق', newVal: newServicePayload.category };
                      if (editingItem.description !== newServicePayload.description) pendingChanges['description'] = { label: 'الوصف الشامل', oldVal: 'الوصف السابق', newVal: 'تحديث الوصف الشامل' };

                      const updatedWithPending = {
                        ...editingItem,
                        status: 'pending_modification',
                        hasPendingEdits: true,
                        pendingChanges: Object.keys(pendingChanges).length > 0 ? pendingChanges : { general: { label: 'تعديلات عامة', oldVal: 'البيانات المعتمدة', newVal: 'بيانات جديدة' } },
                        pendingPayload: newServicePayload
                      };

                      setServices(services.map((s: any) => String(s.id) === String(editingItem.id) ? updatedWithPending : s));
                      
                      try {
                        const stored = localStorage.getItem('stored_services');
                        if (stored) {
                          const list = JSON.parse(stored);
                          const updatedList = list.map((s: any) => String(s.id) === String(editingItem.id) ? updatedWithPending : s);
                          localStorage.setItem('stored_services', JSON.stringify(updatedList));
                        }
                      } catch (e) {}

                      showNotification('info', 'تم رفع تعديلات الخدمة للإدارة بانتظار الاعتماد! تظل الخدمة منشورة ببياناتها السابقة حتى الاعتماد.');
                    } else {
                      const res = await fetch(`/api/bookings/services/${editingItem.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newServicePayload)
                      });
                      if (!res.ok) throw new Error('فشل تحديث الخدمة في قاعدة البيانات الخارجية');
                      savedService = await res.json();
                      
                      const updatedService = {
                        ...serviceForm,
                        ...savedService,
                        id: String(savedService.id),
                      };
                      setServices(services.map((s: any) => s.id === editingItem.id ? updatedService : s));
                      showNotification('success', 'تم حفظ تعديلات الخدمة بنجاح!');
                    }
                  } else {
                    const freshPayload = {
                      ...newServicePayload,
                      status: 'pending',
                      approved: false
                    };
                    const res = await fetch('/api/bookings/services', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(freshPayload)
                    });
                    if (!res.ok) throw new Error('فشل ترحيل الخدمة الجديدة في قاعدة البيانات الخارجية');
                    savedService = await res.json();

                    const addedService = {
                      ...serviceForm,
                      ...freshPayload,
                      ...savedService,
                      id: String(savedService.id),
                    };
                    setServices([addedService, ...services]);
                    showNotification('info', 'تم تقديم طلب الخدمة الجديدة بانتظار موافقة واعتماد الإدارة (Rule 6).');
                  }
                  onClose();
                } catch (err: any) {
                  showNotification('error', 'فشل في حفظ الخدمة: ' + err.message);
                }
              }} 
              className="px-6 py-2.5 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all shadow-md shadow-purple-500/10"
            >
              {editingItem ? 'تأكيد وحفظ عاجل' : 'تأكيد ونشر فوري للخدمة'}
            </button>
          </div>
        </div>

        <MediaDimensionsHelperModal 
          isOpen={showMediaGuideModal} 
          onClose={() => setShowMediaGuideModal(false)} 
        />
      </div>
    </div>
  );
};
