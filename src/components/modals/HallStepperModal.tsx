import React, { useState, useEffect } from 'react';
import { 
  Building2, Info, FileText, Coins, CheckSquare, UploadCloud, X, 
  MapPin, Check, Plus, Edit, Trash2, ShieldCheck, Video, ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PhoneInput, CrNumberInput, TaxNumberInput, NationalIdInput } from '../common/ValidationInputs';
import { validateHallOrServiceImage, validateHallOrServiceVideo } from '../../utils/mediaValidator';
import { MediaDimensionsHelperModal } from '../common/MediaDimensionsHelperModal';
import { VenueStoreManagerModal } from './VenueStoreManagerModal';

interface HallStepperModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: any;
  hallForm: any;
  setHallForm: React.Dispatch<React.SetStateAction<any>>;
  hallModalStep: number;
  setHallModalStep: React.Dispatch<React.SetStateAction<number>>;
  userRole: string;
  currentProviderName: string;
  currentUserName: string;
  providers: any[];
  regions: any[];
  providerSubscription: any;
  inventorySettings: any;
  setHalls: React.Dispatch<React.SetStateAction<any[]>>;
  halls: any[];
  showNotification: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  setMapTarget: React.Dispatch<React.SetStateAction<any>>;
  setIsMapModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const HallStepperModal: React.FC<HallStepperModalProps> = ({
  isOpen,
  onClose,
  editingItem,
  hallForm,
  setHallForm,
  hallModalStep,
  setHallModalStep,
  userRole,
  currentProviderName,
  currentUserName,
  providers,
  regions,
  providerSubscription,
  inventorySettings,
  setHalls,
  halls,
  showNotification,
  setMapTarget,
  setIsMapModalOpen
}) => {
  // Extra services state for step 4
  const [extraServiceName, setExtraServiceName] = useState('');
  const [extraServiceDesc, setExtraServiceDesc] = useState('');
  const [extraServiceQuantity, setExtraServiceQuantity] = useState<number | ''>(1);
  const [extraServicePrice, setExtraServicePrice] = useState<number | ''>(0);
  const [editingExtraServiceId, setEditingExtraServiceId] = useState<string | null>(null);
  const [isStoreManagerOpen, setIsStoreManagerOpen] = useState(false);
  
  // Image upload state
  const [isUploadingHallImages, setIsUploadingHallImages] = useState(false);
  const [showMediaGuideModal, setShowMediaGuideModal] = useState(false);

  // Sync extra service edit forms when selecting to edit
  const handleAddOrUpdateExtraService = () => {
    if (!extraServiceName.trim()) {
      alert("الرجاء إدخال اسم الخدمة");
      return;
    }
    const priceNum = Number(extraServicePrice) || 0;
    const qtyNum = Number(extraServiceQuantity) || 1;
    const list = hallForm.extraServicesList || [];
    
    if (editingExtraServiceId) {
      const updatedList = list.map((s: any) => 
        String(s.id) === String(editingExtraServiceId) 
          ? { ...s, name: extraServiceName, desc: extraServiceDesc, description: extraServiceDesc, quantity: qtyNum, price: priceNum } 
          : s
      );
      setHallForm({ ...hallForm, extraServicesList: updatedList });
      setEditingExtraServiceId(null);
    } else {
      const newService = {
        id: Date.now().toString(),
        name: extraServiceName,
        desc: extraServiceDesc,
        description: extraServiceDesc,
        quantity: qtyNum,
        price: priceNum
      };
      setHallForm({ ...hallForm, extraServicesList: [...list, newService] });
    }
    
    setExtraServiceName('');
    setExtraServiceDesc('');
    setExtraServiceQuantity(1);
    setExtraServicePrice(0);
  };

  const handleEditExtraService = (service: any) => {
    setExtraServiceName(service.name || '');
    setExtraServiceDesc(service.desc || service.description || '');
    setExtraServiceQuantity(service.quantity || 1);
    setExtraServicePrice(service.price || 0);
    setEditingExtraServiceId(String(service.id));
  };

  const handleDeleteExtraService = (id: string) => {
    const list = hallForm.extraServicesList || [];
    const updatedList = list.filter((s: any) => String(s.id) !== String(id));
    setHallForm({ ...hallForm, extraServicesList: updatedList });
    if (String(editingExtraServiceId) === String(id)) {
      setEditingExtraServiceId(null);
      setExtraServiceName('');
      setExtraServiceDesc('');
      setExtraServiceQuantity(1);
      setExtraServicePrice(0);
    }
  };

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>, fieldName: 'crFile' | 'vatFile' | 'ibanFile') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("الرجاء رفع مستند بصيغة صورة صالحة (PNG, JPG, JPEG) لمعاينته بنجاح.");
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      showNotification('info', `جاري رفع مستند ${fieldName === 'crFile' ? 'السجل التجاري' : fieldName === 'vatFile' ? 'القيمة المضافة' : 'الآيبان'} ...`);
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        throw new Error('فشل رفع المستند للخادم');
      }
      const data = await response.json();
      if (data && data.url) {
        setHallForm(prev => ({
          ...prev,
          [fieldName]: data.url
        }));
        showNotification('success', 'تم رفع المستند ومعاينته بنجاح.');
      }
    } catch (err: any) {
      showNotification('error', 'خطأ في الرفع: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col md:flex-row md:h-[640px] h-full max-h-[95vh]" dir="rtl">
        
        {/* Sidebar Steps Panel */}
        <div className="hidden md:flex flex-col w-72 bg-slate-50/80 border-l border-slate-100 p-5 self-stretch justify-between shrink-0">
          <div className="space-y-5">
            <div className="pb-3 border-b border-slate-200/60">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block mb-0.5">خطوات الإدخال</span>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-4.5 h-4.5 text-amber-500" />
                بيانات القاعة/المرفق
              </h3>
            </div>
            
            <div className="space-y-2.5">
              {[
                { number: 1, title: 'البيانات والعنوان', desc: 'الاسم والتصنيف وموقع المرفق', icon: Info },
                { number: 2, title: 'التراخيص والمالية', desc: 'السجل التجاري والملفات الإثباتية', icon: FileText },
                { number: 3, title: 'السعة والأسعار', desc: 'تحديد الأسعار والسياسات للفترات', icon: Coins },
                { number: 4, title: 'الشروط والمدفوعات', desc: 'شروط العقد وخيارات الدفع', icon: CheckSquare },
                { number: 5, title: 'الصور والحالة والتأكيد', desc: 'رفع الصور، الاعتماد وحفظ البيانات', icon: UploadCloud }
              ].map((s) => {
                const StepIcon = s.icon;
                const isActive = hallModalStep === s.number;
                const isCompleted = hallModalStep > s.number;
                return (
                  <button
                    key={s.number}
                    onClick={() => s.number === 1 || hallForm.name ? setHallModalStep(s.number) : alert('الرجاء تعبئة اسم المرفق بالخطوة الأولى للتنقل بين المراحل')}
                    className={`w-full text-right flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                      isActive 
                        ? 'bg-amber-500/10 border-amber-200/60 text-amber-900 shadow-sm' 
                        : isCompleted 
                          ? 'border-transparent text-emerald-700 hover:bg-slate-100' 
                          : 'border-transparent text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center transition-colors font-bold text-xs ${
                      isActive 
                        ? 'bg-amber-500 text-slate-900 shadow-sm' 
                        : isCompleted 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-slate-200 text-slate-600'
                    }`}>
                      {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.number}
                    </div>
                    <div className="min-w-0 pr-1">
                      <p className={`text-xs font-bold leading-none mb-1 ${isActive ? 'text-amber-950' : isCompleted ? 'text-emerald-850' : 'text-slate-700'}`}>
                        {s.title}
                      </p>
                      <p className="text-[9px] text-slate-400 truncate">
                        {s.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="pt-3 border-t border-slate-200/60 text-[10px] text-slate-400 leading-relaxed font-sans">
            بواسطة المالك الحالي: <span className="font-bold text-slate-705 block mt-0.5">{hallForm.hostName}</span>
          </div>
        </div>

        {/* Mobile visual step markers (Top) */}
        <div className="flex md:hidden items-center justify-between p-3 bg-slate-50/80 backdrop-blur-sm border-b border-slate-150 gap-1.5 overflow-x-auto shrink-0 scrollbar-none" dir="rtl">
          {[
            { number: 1, title: 'الموقع' },
            { number: 2, title: 'التراخيص والمالية' },
            { number: 3, title: 'السعة والأسعار' },
            { number: 4, title: 'الاشتراطات' },
            { number: 5, title: 'الصور والتأكيد' }
          ].map((s) => (
            <button
              key={s.number}
              onClick={() => s.number === 1 || hallForm.name ? setHallModalStep(s.number) : alert('الرجاء تعبئة الاسم بالخطوة الأولى')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all duration-250 border ${
                hallModalStep === s.number 
                  ? 'bg-amber-505 border-amber-500 text-slate-950 shadow-md shadow-amber-500/15' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>

        {/* Main Form Area */}
        <div className="flex-1 flex flex-col min-h-0 bg-white">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                {editingItem ? 'تعديل بيانات القاعة / المرفق' : 'إضافة قاعة / مرفق جديد'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">يرجى ملء كافة الحقول بدقة لضمان تماسك نظام الحجوزات والمخزون.</p>
            </div>
            <button 
              onClick={onClose} 
              className="bg-slate-50 hover:bg-red-50 hover:text-red-500 border border-slate-100 text-slate-400 p-2 rounded-full transition-all duration-150 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Step Contents */}
          <div className="flex-1 px-6 py-4 overflow-y-auto">
            <AnimatePresence mode="wait">
              {hallModalStep === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3.5"
                >
                  <div className="flex items-center gap-2 border-r-4 border-amber-500 pr-3 py-0.5">
                    <span className="text-xs font-bold text-amber-600 tracking-wider">الخطوة الأولى</span>
                    <span className="text-slate-450 text-xs">|</span>
                    <h4 className="text-xs font-bold text-slate-800">بيانات المواصفات العامة والهوية الجغرافية والموقع لشغل المرفق</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">اسم القاعة / المرفق للعملاء <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        value={hallForm.name || ''} 
                        onChange={e => setHallForm({...hallForm, name: e.target.value})} 
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none bg-slate-50/30 hover:bg-white transition-all duration-200" 
                        placeholder="مثال: قاعة اللؤلؤة الكبرى" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">نوع وتصنيف المرفق <span className="text-red-500">*</span></label>
                      <select 
                        value={hallForm.category || ''} 
                        onChange={e => setHallForm({...hallForm, category: e.target.value})} 
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none bg-slate-50/30 hover:bg-white transition-all duration-200"
                      >
                        {(() => {
                          try {
                            const stored = localStorage.getItem('SYSTEM_DATastore_hallCategories');
                            if (stored) return JSON.parse(stored);
                          } catch (e) {}
                          return ['قاعة أفراح', 'استراحة قسم', 'استراحة قسمين', 'شاليه', 'منتجع', 'متنزه', 'مخيم', 'قاعة اجتماع', 'أخرى'];
                        })().map((cat: string) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1 font-sans">اسم مزود الخدمة <span className="text-red-500">*</span></label>
                      {userRole === 'admin' ? (
                        <select 
                          value={hallForm.provider || ''} 
                          onChange={e => setHallForm({...hallForm, provider: e.target.value})} 
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none bg-slate-50/30 hover:bg-white transition-all duration-200 font-sans"
                        >
                          <option value="">اختر مزود الخدمة</option>
                          {providers.map((p: any) => (
                            <option key={p.id} value={p.name}>{p.name}</option>
                          ))}
                        </select>
                      ) : (
                        <input 
                          type="text" 
                          value={hallForm.provider || (userRole === 'provider' ? currentProviderName : '') || 'مزود خدمة'} 
                          disabled 
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 outline-none cursor-not-allowed font-medium font-sans" 
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">رقم الجوال الفعال <span className="text-red-500">*</span></label>
                      <PhoneInput value={hallForm.phone || ''} onChange={e => setHallForm({...hallForm, phone: e.target.value})} label="" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">البريد الإلكتروني للجهة <span className="text-red-500">*</span></label>
                      <input 
                        type="email" 
                        value={hallForm.email || ''} 
                        onChange={e => setHallForm({...hallForm, email: e.target.value})} 
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none text-left bg-slate-50/30 hover:bg-white transition-all duration-200 placeholder:text-slate-400" 
                        placeholder="email@example.com" 
                        dir="ltr" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">المنطقة <span className="text-red-500">*</span></label>
                      <select 
                        value={hallForm.region || ''} 
                        onChange={e => { setHallForm({...hallForm, region: e.target.value}); setHallForm(prev => ({...prev, city: ''})) }} 
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none bg-slate-50/30 hover:bg-white transition-all duration-200"
                      >
                        <option value="">اختر المنطقة</option>
                        {regions.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">المدينة <span className="text-red-500">*</span></label>
                      <select 
                        value={hallForm.city || ''} 
                        onChange={e => setHallForm({...hallForm, city: e.target.value})} 
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none bg-slate-50/30 hover:bg-white transition-all duration-200"
                      >
                        <option value="">اختر المدينة</option>
                        {regions.find(r => r.name === hallForm.region)?.cities?.map((c: string) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">العنوان الوطني المعتمد <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <input 
                          type="text" 
                          value={hallForm.nationalAddress || ''} 
                          onChange={e => setHallForm({...hallForm, nationalAddress: e.target.value})} 
                          className="w-full text-xs p-2.5 pl-10 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none bg-slate-50/30 hover:bg-white placeholder:text-left font-mono uppercase transition-all duration-200" 
                          placeholder="مثال: RWQA1234 أو العنوان الرباعي" 
                          dir="ltr" 
                        />
                        <button 
                          type="button" 
                          onClick={() => { setMapTarget({ type: 'hall', field: 'nationalAddress' }); setIsMapModalOpen(true); }} 
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-amber-500 transition-colors cursor-pointer" 
                          title="تحديد من الخريطة"
                        >
                          <MapPin className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">تفاصيل ومميزات الموقع</label>
                      <input 
                        type="text" 
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none bg-slate-50/30 hover:bg-white transition-all duration-200" 
                        value={hallForm.extraAddress || ''} 
                        onChange={e => setHallForm({...hallForm, extraAddress: e.target.value})} 
                        placeholder="مثل: حي النرجس، تقاطع طريق..." 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">عن المرفق ووصف التجهيزات</label>
                    <textarea 
                      value={hallForm.description || ''} 
                      onChange={e => setHallForm({...hallForm, description: e.target.value})} 
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none min-h-[50px] max-h-[60px] bg-slate-50/30 hover:bg-white transition-all duration-200" 
                      placeholder="وصف عام للزوار يوضح المساحات والتشطيبات والتجهيزات الداخلية..." 
                      rows={2}
                    />
                  </div>
                </motion.div>
              )}

              {hallModalStep === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 border-r-4 border-amber-500 pr-3 py-0.5">
                    <span className="text-xs font-bold text-amber-600 tracking-wider">الخطوة الثانية</span>
                    <span className="text-slate-450 text-xs">|</span>
                    <h4 className="text-xs font-bold text-slate-800">بيانات التراخيص الحكومية والملفات التجارية</h4>
                  </div>

                  <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100/80">
                    <label className="block text-xs font-semibold text-slate-500 mb-2">نوع الكيان التجاري لمزوّد الخدمة <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        type="button" 
                        onClick={() => setHallForm({...hallForm, providerType: 'منشأة'})}
                        className={`flex justify-center items-center gap-2 px-4 py-2 border rounded-xl transition-all duration-200 cursor-pointer ${
                          hallForm.providerType === 'منشأة' 
                            ? 'border-amber-500 bg-amber-500/10 text-amber-900 font-bold shadow-sm ring-2 ring-amber-500/10' 
                            : 'border-slate-200 text-slate-500 bg-white hover:border-slate-350'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${hallForm.providerType === 'منشأة' ? 'border-amber-500 bg-amber-500' : 'border-slate-300 bg-white'}`}>
                          {hallForm.providerType === 'منشأة' && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                        </div>
                        <span className="text-xs font-sans">مؤسسة / منشأة تجارية (CR)</span>
                      </button>
                      
                      <button 
                        type="button" 
                        onClick={() => setHallForm({...hallForm, providerType: 'فرد'})}
                        className={`flex justify-center items-center gap-2 px-4 py-2 border rounded-xl transition-all duration-200 cursor-pointer ${
                          hallForm.providerType === 'فرد' 
                            ? 'border-amber-505 bg-amber-500/10 text-amber-900 font-bold shadow-sm ring-2 ring-amber-500/10' 
                            : 'border-slate-200 text-slate-500 bg-white hover:border-slate-355'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${hallForm.providerType === 'فرد' ? 'border-amber-500 bg-amber-500' : 'border-slate-300 bg-white'}`}>
                          {hallForm.providerType === 'فرد' && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                        </div>
                        <span className="text-xs font-sans">وثيقة عمل مستقل (Freelancer)</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {hallForm.providerType === 'منشأة' ? (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">رقم السجل التجاري <span className="text-red-500">*</span></label>
                          <CrNumberInput value={hallForm.crNumber} onChange={e => setHallForm({...hallForm, crNumber: e.target.value})} label="" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">تاريخ انتهاء السجل <span className="text-red-500">*</span></label>
                          <input 
                            type="date" 
                            value={hallForm.crExpiryDate || ''} 
                            onChange={e => setHallForm({...hallForm, crExpiryDate: e.target.value})} 
                            className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none bg-slate-50/30 hover:bg-white transition-all duration-200" 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">الرقم الضريبي للمنشأة</label>
                          <TaxNumberInput value={hallForm.taxNumber} onChange={e => setHallForm({...hallForm, taxNumber: e.target.value})} label="" />
                        </div>
                      </>
                    ) : (
                      <div className="md:col-span-3">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">رقم الهوية الوطنية أو رخصة العمل الحر ذات الصلة <span className="text-red-500">*</span></label>
                        <NationalIdInput value={hallForm.crNumber} onChange={e => setHallForm({...hallForm, crNumber: e.target.value})} label="" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-bold text-slate-800 block">الملفات والمستندات الثبوتية القانونية:</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      
                      {/* CR File Card */}
                      <div className="relative border border-dashed rounded-xl h-28 flex flex-col justify-center items-center text-center transition-all duration-200 hover:border-amber-500 overflow-hidden border-slate-200 bg-slate-50/40">
                        {hallForm.crFile && typeof hallForm.crFile === 'string' ? (
                          <div className="absolute inset-0 w-full h-full group">
                            <img src={hallForm.crFile} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <span className="text-[10px] font-bold text-white">معاينة السجل التجاري</span>
                              <button 
                                type="button" 
                                onClick={() => setHallForm({...hallForm, crFile: null})} 
                                className="bg-rose-600 text-white rounded-full p-1.5 hover:bg-rose-700 hover:scale-105 transition-all cursor-pointer"
                                title="حذف المستند"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <input 
                              type="file" 
                              accept="image/*"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                              onChange={e => handleDocumentUpload(e, 'crFile')} 
                            />
                            <div className="flex flex-col items-center gap-1 p-2">
                              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-600">
                                <UploadCloud className="w-4.5 h-4.5 animate-pulse" />
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-705 block">السجل التجاري / الهوية</span>
                                <span className="text-[9px] text-slate-400 block truncate max-w-[170px]">اضغط لرفع صورة للمعاينه</span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* VAT File Card */}
                      <div className="relative border border-dashed rounded-xl h-28 flex flex-col justify-center items-center text-center transition-all duration-200 hover:border-amber-500 overflow-hidden border-slate-200 bg-slate-50/40">
                        {hallForm.vatFile && typeof hallForm.vatFile === 'string' ? (
                          <div className="absolute inset-0 w-full h-full group">
                            <img src={hallForm.vatFile} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <span className="text-[10px] font-bold text-white">معاينة القيمة المضافة</span>
                              <button 
                                type="button" 
                                onClick={() => setHallForm({...hallForm, vatFile: null})} 
                                className="bg-rose-600 text-white rounded-full p-1.5 hover:bg-rose-700 hover:scale-105 transition-all cursor-pointer"
                                title="حذف المستند"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <input 
                              type="file" 
                              accept="image/*"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                              onChange={e => handleDocumentUpload(e, 'vatFile')} 
                            />
                            <div className="flex flex-col items-center gap-1 p-2">
                              <div className="p-1.5 rounded-lg bg-slate-100 text-slate-500">
                                <UploadCloud className="w-4.5 h-4.5" />
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-750 block">شهادة القيمة المضافة</span>
                                <span className="text-[9px] text-slate-400 block truncate max-w-[175px]">ملف اختياري</span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* IBAN File Card */}
                      <div className="relative border border-dashed rounded-xl h-28 flex flex-col justify-center items-center text-center transition-all duration-200 hover:border-amber-500 overflow-hidden border-slate-200 bg-slate-50/40">
                        {hallForm.ibanFile && typeof hallForm.ibanFile === 'string' ? (
                          <div className="absolute inset-0 w-full h-full group">
                            <img src={hallForm.ibanFile} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <span className="text-[10px] font-bold text-white">معاينة خطاب الآيبان</span>
                              <button 
                                type="button" 
                                onClick={() => setHallForm({...hallForm, ibanFile: null})} 
                                className="bg-rose-600 text-white rounded-full p-1.5 hover:bg-rose-700 hover:scale-105 transition-all cursor-pointer"
                                title="حذف المستند"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <input 
                              type="file" 
                              accept="image/*"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                              onChange={e => handleDocumentUpload(e, 'ibanFile')} 
                            />
                            <div className="flex flex-col items-center gap-1 p-2">
                              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-600">
                                <UploadCloud className="w-4.5 h-4.5" />
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-707 block">خطاب تعريف الآيبان (IBAN)</span>
                                <span className="text-[9px] text-slate-400 block truncate max-w-[175px]">صورة بطاقة الحساب مفرودة</span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                    </div>
                  </div>
                </motion.div>
              )}

              {hallModalStep === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3.5"
                >
                  <div className="flex items-center gap-2 border-r-4 border-amber-500 pr-3 py-0.5">
                    <span className="text-xs font-bold text-amber-600 tracking-wider">الخطوة الثالثة</span>
                    <span className="text-slate-450 text-xs">|</span>
                    <h4 className="text-xs font-bold text-slate-800">تحديد طاقة المرفق وسياسات الضمان وإقرارات الأسعار</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">السعة القصوى للمرفق <span className="text-slate-400 font-normal">(أفراد)</span></label>
                      <input 
                        type="text" 
                        value={hallForm.capacity || ''} 
                        onChange={e => setHallForm({...hallForm, capacity: e.target.value})} 
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none bg-slate-50/30 hover:bg-white transition-all duration-200" 
                        placeholder="مثال: تتسع لـ 300 شخص" 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1 justify-between">
                        <span>فترة الاسترجاع عند الإلغاء</span>
                        <span className="text-[9px] bg-slate-200 text-slate-705 px-1.5 py-0.5 rounded-md font-sans">بالأيام</span>
                      </label>
                      <input 
                        type="number" 
                        value={hallForm.cancellationPeriod ?? ''} 
                        onChange={e => setHallForm({...hallForm, cancellationPeriod: e.target.value})} 
                        onBlur={(e) => {
                          const val = e.target.value;
                          let msg = "";
                          if (val === "") msg = "تنبيه: ترك الحقل فارغاً يعني أن الحجز غير مسترد نهائياً.";
                          else if (val === "0") msg = "تنبيه: القيمة (0) تعني إمكانية الإلغاء والاسترداد حتى آخر يوم قبل موعد الحجز.";
                          else msg = `تنبيه: سيتمكن العميل من استرداد مبلغه إذا ألغى الحجز قبل ${val} يوم من الموعد.`;
                          
                          if (msg) {
                            alert(msg + "\n\nيرجى التأكد من إضافة هذا الشرط بوضوح ضمن 'شروط العقد' لضمان حقوقك القانونية.");
                          }
                        }}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none bg-slate-50/30 hover:bg-white transition-all duration-200 placeholder:text-slate-400" 
                        placeholder="مثال: 14 يوم (اتركه فارغاً للغير مسترد)" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">مبلغ تأمين السلامة <span className="text-slate-400 font-normal">(ريال مسترد)</span></label>
                      <input 
                        type="number" 
                        value={hallForm.security_deposit_amount ?? 1000} 
                        onChange={e => setHallForm({...hallForm, security_deposit_amount: Number(e.target.value)})} 
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none bg-slate-50/30 hover:bg-white transition-all duration-200 font-mono text-left" 
                        placeholder="مثال: 1000" 
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100 space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">أسعار الفترات الأساسية لشغل المكان (ر.س):</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      
                      <div className="bg-white p-2.5 rounded-xl border border-slate-150 flex items-center justify-between">
                        <div className="min-w-0">
                          <span className="block text-[10px] font-semibold text-slate-505">الفترة الصباحية</span>
                          <span className="text-[9px] text-slate-400">من الشروق للمغيب</span>
                        </div>
                        <input 
                          type="number" 
                          value={hallForm.morningPrice ?? 0} 
                          onChange={e => setHallForm({...hallForm, morningPrice: Number(e.target.value) || 0})} 
                          className="w-24 text-xs font-bold text-slate-800 p-1 border-b border-slate-200 focus:border-amber-500 outline-none font-mono text-left" 
                          placeholder="0.00" 
                        />
                      </div>
                      
                      <div className="bg-white p-2.5 rounded-xl border border-slate-150 flex items-center justify-between">
                        <div className="min-w-0">
                          <span className="block text-[10px] font-semibold text-slate-510">الفترة المسائية</span>
                          <span className="text-[9px] text-slate-400">من المغيب لمنتصف الليل</span>
                        </div>
                        <input 
                          type="number" 
                          value={hallForm.nightPrice ?? 0} 
                          onChange={e => setHallForm({...hallForm, nightPrice: Number(e.target.value) || 0})} 
                          className="w-24 text-xs font-bold text-slate-800 p-1 border-b border-slate-200 focus:border-amber-500 outline-none font-mono text-left" 
                          placeholder="0.00" 
                        />
                      </div>

                      <div className="bg-amber-500/[0.03] p-2.5 rounded-xl border border-amber-200 flex items-center justify-between">
                        <div className="min-w-0">
                          <span className="block text-[10px] font-semibold text-amber-805">تأجير اليوم الكامل</span>
                          <span className="text-[9px] text-amber-600/80">شامل الفترتين كاملتين</span>
                        </div>
                        <input 
                          type="number" 
                          value={hallForm.fullDayPrice ?? 0} 
                          onChange={e => setHallForm({...hallForm, fullDayPrice: Number(e.target.value) || 0})} 
                          className="w-24 text-xs font-bold text-slate-800 p-1 border-b border-amber-300 focus:border-amber-500 outline-none font-mono text-left" 
                          placeholder="0.00" 
                        />
                      </div>

                    </div>
                  </div>

                  {((userRole === 'admin') || providerSubscription?.includesDynamicPricing || providerSubscription?.addons?.includes('dynamic_pricing')) && (
                    <div className="bg-amber-500/[0.02] p-3 rounded-xl border border-amber-500/10 space-y-2">
                      <h5 className="font-bold text-slate-850 flex items-center gap-1.5 text-xs">
                        <Plus className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                        هوامش زيادة أسعار حجوزات نهاية الأسبوع (الويكند)
                      </h5>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-505 mb-1">طريقة الحساب</label>
                          <select 
                            value={hallForm.weekendMultiplierType || 'percentage'} 
                            onChange={e => setHallForm({...hallForm, weekendMultiplierType: e.target.value})}
                            className="w-full text-[10px] p-2 rounded-lg border border-slate-200 bg-white"
                          >
                            <option value="percentage">نسبة مئوية (%)</option>
                            <option value="fixed">مبلغ ثابت (ريال)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-slate-510 mb-1">هامش الصباح</label>
                          <input 
                            type="number" 
                            value={hallForm.weekend_morning_margin ?? 0} 
                            onChange={e => setHallForm({...hallForm, weekend_morning_margin: Number(e.target.value)})}
                            className="w-full text-[10px] p-2 rounded-lg border border-slate-200 bg-white font-mono text-left"
                            placeholder={hallForm.weekendMultiplierType === 'percentage' ? '20%' : '500 ر.س'}
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-slate-515 mb-1">هامش المساء</label>
                          <input 
                            type="number" 
                            value={hallForm.weekend_night_margin ?? 0} 
                            onChange={e => setHallForm({...hallForm, weekend_night_margin: Number(e.target.value)})}
                            className="w-full text-[10px] p-2 rounded-lg border border-slate-200 bg-white font-mono text-left"
                            placeholder={hallForm.weekendMultiplierType === 'percentage' ? '20%' : '500 ر.س'}
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-slate-520 mb-1">هامش اليوم كامل</label>
                          <input 
                            type="number" 
                            value={hallForm.weekend_fullDay_margin ?? 0} 
                            onChange={e => setHallForm({...hallForm, weekend_fullDay_margin: Number(e.target.value)})}
                            className="w-full text-[10px] p-2 rounded-lg border border-slate-200 bg-white font-mono text-left"
                            placeholder={hallForm.weekendMultiplierType === 'percentage' ? '20%' : '1000 ر.س'}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-2.5 bg-blue-500/[0.03] border border-blue-500/10 rounded-xl flex items-start gap-2 text-[10px] text-blue-800">
                    <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <span className="font-bold text-blue-950">حماية أسعار المرفق:</span> نظام حظر وإقفال الأسعار مفعل تلقائياً بحد <span className="font-bold">{inventorySettings.priceChangeLockPeriod || 7} أيام</span> من آخر تحديث، لضمان استقرار عقود الحجز وثقة المستأجرين.
                    </div>
                  </div>
                </motion.div>
              )}

              {hallModalStep === 4 && (
                <motion.div 
                  key="step4"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3.5"
                >
                  <div className="flex items-center gap-2 border-r-4 border-amber-500 pr-3 py-0.5">
                    <span className="text-xs font-bold text-amber-600 tracking-wider">الخطوة الرابعة</span>
                    <span className="text-slate-450 text-xs">|</span>
                    <h4 className="text-xs font-bold text-slate-800">تحديد مميزات المكان وتدبيج الشروط والقواعد وجيت الحجوزات</h4>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">المميزات التجهيزية ووسائل الدعم للمكان <span className="text-slate-400 font-normal">(مفصولة بفاصلة)</span></label>
                    <input 
                      type="text" 
                      value={hallForm.facilities || ''} 
                      onChange={e => setHallForm({...hallForm, facilities: e.target.value})} 
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none bg-slate-50/30 hover:bg-white transition-all duration-200" 
                      placeholder="مثال: مواقف خاصة، تجهيز عروس، بوفيه تحضيري، حراسة ومتابعة، نظام عزل صوتي..." 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">محاذير وقواعد الاستخدام <span className="text-slate-400 font-normal">(الأنظمة المعمول بها في الصالة)</span></label>
                      <textarea 
                        value={hallForm.rules || ''} 
                        onChange={e => setHallForm({...hallForm, rules: e.target.value})} 
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none bg-slate-50/30 hover:bg-white transition-all duration-200 resize-none h-20" 
                        placeholder="مثال: يمنع استخدام الألعاب النارية، التدخين مسموح بالخارج فقط، الالتزام بالوقت المقرر..." 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">شرح بنود العقد والمدفوعات الخاصة بالمواطن</label>
                      <textarea 
                        value={hallForm.contractTerms || ''} 
                        onChange={e => setHallForm({...hallForm, contractTerms: e.target.value})} 
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none bg-slate-50/30 hover:bg-white transition-all duration-200 resize-none h-20" 
                        placeholder="مثال: يتم دفع 30% من قيمة العقد مقدمًا غير مسترد كعربون، الالتزام بسلسلة الضوابط والمستحقات..." 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">طرق الدفع المفعلة للمرفق</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'mada', label: 'مدى (Mada)' },
                        { id: 'creditMax', label: 'بطاقة ائتمانية' },
                        { id: 'apple', label: 'Apple Pay' },
                        { id: 'stc', label: 'stc pay' },
                      ].map((pm) => {
                        const isSelected = (hallForm.paymentMethods || []).includes(pm.id);
                        return (
                          <button
                            type="button"
                            key={pm.id}
                            onClick={() => {
                              const current = hallForm.paymentMethods || [];
                              if (isSelected) {
                                setHallForm({...hallForm, paymentMethods: current.filter((x: string) => x !== pm.id)});
                              } else {
                                setHallForm({...hallForm, paymentMethods: [...current, pm.id]});
                              }
                            }}
                            className={`p-2 rounded-xl text-[10px] font-bold border transition-all text-center cursor-pointer ${
                              isSelected 
                                ? 'bg-amber-500/10 border-amber-300 text-amber-900 font-extrabold' 
                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-white'
                            }`}
                          >
                            {pm.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mini-Store Management Card in Step 4 */}
                  <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-50 p-3.5 rounded-xl border border-amber-300/80 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="text-xs font-black text-slate-900">متجر المستلزمات والمنتجات المصغر للقاعة 🛍️</h5>
                          <p className="text-[10px] text-slate-500">تخصيص مستلزمات الضيافة، المشروبات، الأثاث، والمخزون المعروض للعملاء أثناء حجز هذه القاعة</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsStoreManagerOpen(true)}
                        className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95 border border-amber-400"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>إدارة وتخصيص المتجر المصغر 🛍️</span>
                      </button>
                    </div>
                  </div>

                  {/* Services Panel */}
                  <div className="border border-slate-150 bg-slate-50/10 p-3.5 rounded-xl space-y-3.5 mt-3">
                    <div className="flex items-center gap-2 border-r-4 border-amber-500 pr-2">
                      <h5 className="text-[11px] font-bold text-slate-800">إضافة وإدارة الخدمات الإضافية التابعة للمركز (اختياري)</h5>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-1">اسم الخدمة <span className="text-rose-500">*</span></label>
                        <input 
                          type="text" 
                          value={extraServiceName}
                          onChange={e => setExtraServiceName(e.target.value)}
                          className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white outline-none focus:border-amber-500 text-slate-705"
                          placeholder="مثال: ضيافة قهوة وشاي"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-1">الوصف</label>
                        <input 
                          type="text" 
                          value={extraServiceDesc}
                          onChange={e => setExtraServiceDesc(e.target.value)}
                          className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white outline-none focus:border-amber-500 text-slate-705"
                          placeholder="مثال: تقديم قهوة عربية وشاي..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-1">الكمية</label>
                          <input 
                            type="number" 
                            value={extraServiceQuantity}
                            onChange={e => setExtraServiceQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                            min={1}
                            className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white outline-none focus:border-amber-500 text-slate-705"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-1">السعر (ر.س)</label>
                          <input 
                            type="number" 
                            value={extraServicePrice}
                            onChange={e => setExtraServicePrice(e.target.value === '' ? '' : Number(e.target.value))}
                            min={0}
                            className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white outline-none focus:border-amber-500 text-slate-705"
                          />
                        </div>
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={handleAddOrUpdateExtraService}
                          className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer ${
                            editingExtraServiceId 
                              ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                              : 'bg-amber-500 text-slate-900 hover:bg-amber-600'
                          }`}
                        >
                          {editingExtraServiceId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                          {editingExtraServiceId ? 'تحديث الخدمة' : 'إضافة الخدمة'}
                        </button>
                      </div>
                    </div>

                    {editingExtraServiceId && (
                      <div className="text-[10px] text-emerald-650 font-bold flex items-center gap-1">
                        <span>جاري تعديل إحدى الخدمات المدخلة حالاً.</span>
                        <button 
                          type="button" 
                          onClick={() => {
                            setEditingExtraServiceId(null);
                            setExtraServiceName('');
                            setExtraServiceDesc('');
                            setExtraServiceQuantity(1);
                            setExtraServicePrice(0);
                          }}
                          className="text-slate-450 hover:text-rose-500 font-normal underline"
                        >
                          إلغاء التعديل
                        </button>
                      </div>
                    )}

                    {/* List of Added Services */}
                    <div className="overflow-y-auto max-h-[140px] border border-slate-100 rounded-xl bg-white mt-1">
                      <table className="w-full text-right border-collapse text-[10px]">
                        <thead>
                          <tr className="bg-slate-50 text-[9px] font-bold text-slate-500 border-b border-slate-100 sticky top-0 z-10">
                            <th className="p-2">اسم الخدمة</th>
                            <th className="p-2">الوصف</th>
                            <th className="p-2 w-16 text-center">الكمية</th>
                            <th className="p-2 w-20 text-center">السعر</th>
                            <th className="p-2 w-16 text-center">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-slate-700">
                          {(hallForm.extraServicesList || []).length > 0 ? (
                            (hallForm.extraServicesList || []).map((serv: any, i: number) => (
                              <tr key={serv.id || i} className="hover:bg-slate-50/50">
                                <td className="p-2 font-bold text-slate-800">{serv.name}</td>
                                <td className="p-2 text-slate-500 max-w-[150px] truncate" title={serv.desc || serv.description}>{serv.desc || serv.description || '-'}</td>
                                <td className="p-2 text-center font-mono font-bold">{serv.quantity || serv.qty || 1}</td>
                                <td className="p-2 text-center font-mono font-bold text-emerald-700">{serv.price} ر.س</td>
                                <td className="p-2 text-center">
                                  <div className="flex justify-center gap-1">
                                    <button 
                                      type="button"
                                      onClick={() => handleEditExtraService(serv)}
                                      className="text-amber-600 hover:bg-amber-50 p-1 rounded transition-colors"
                                      title="تعديل"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={() => handleDeleteExtraService(serv.id)}
                                      className="text-rose-600 hover:bg-rose-50 p-1 rounded transition-colors"
                                      title="حذف"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="p-4 text-center text-slate-400">لا توجد خدمات إضافية مضافة حالياً. استخدم النموذج أعلاه للإضافة.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {hallModalStep === 5 && (
                <motion.div 
                  key="step5"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 border-r-4 border-amber-500 pr-3 py-0.5">
                    <span className="text-xs font-bold text-amber-600 tracking-wider">الخطوة الخامسة</span>
                    <span className="text-slate-450 text-xs">|</span>
                    <h4 className="text-xs font-bold text-slate-800">ألبوم الصور، التعهد، وتدبير الحالة التشغيلية للمقاصة</h4>
                  </div>

                  {/* Images & Video Upload Section according to Rule 7 */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                        <label className="block text-xs font-bold text-slate-700">ألبوم صور المرفق والقاعة (حد أقصى 10 صور)</label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowMediaGuideModal(true)}
                            className="text-[10px] bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 px-2.5 py-0.5 rounded-full font-bold border border-amber-500/30 transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <span>📱 دليل التصوير الأفقي والوسائط</span>
                          </button>
                          <span className="text-[9px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-semibold border border-amber-200/60">
                            الاشتراطات: 500KB | 16:9
                          </span>
                        </div>
                      </div>
                      <div className="border-2 border-dashed border-amber-200 bg-amber-50/10 hover:border-amber-400 rounded-xl p-4 text-center transition-all relative hover:bg-amber-50/20 cursor-pointer flex flex-col justify-center items-center">
                        <input 
                          type="file" 
                          multiple 
                          accept="image/jpeg,image/png,image/webp,image/jpg" 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                          disabled={isUploadingHallImages}
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []) as File[];
                            if (files.length === 0) return;

                            const currentImages = hallForm.images || [];
                            if (currentImages.length + files.length > 10) {
                              alert('الحد الأقصى المسموح به هو 10 صور للقاعة/المرفق');
                              return;
                            }

                            setIsUploadingHallImages(true);
                            const uploadedUrls: string[] = [];

                            for (const file of files) {
                              // Validate file according to Rule 7
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
                              try {
                                const response = await fetch('/api/upload', {
                                  method: 'POST',
                                  body: formData
                                });
                                if (!response.ok) {
                                  throw new Error('فشل رفع الصورة');
                                }
                                const resData = await response.json();
                                if (resData && resData.url) {
                                  uploadedUrls.push(resData.url);
                                }
                              } catch (err) {
                                console.error('Error uploading file:', file.name, err);
                                alert(`فشل رفع الصورة: ${file.name}`);
                              }
                            }

                            if (uploadedUrls.length > 0) {
                              setHallForm((prev: any) => {
                                const updatedList = [...(prev.images || []), ...uploadedUrls];
                                return {
                                  ...prev,
                                  images: updatedList,
                                  image: prev.image || updatedList[0]
                                };
                              });
                            }
                            setIsUploadingHallImages(false);
                          }} 
                        />
                        <UploadCloud className="w-6 h-6 text-amber-500 mb-1 animate-pulse" />
                        <p className="text-[11px] font-bold text-slate-700">
                          {isUploadingHallImages ? 'جاري التحقق والرفع للخادم...' : 'اسحب الصور هنا أو انقر للاستيراد والرفع'}
                        </p>
                        <p className="text-[9px] text-slate-500 mt-0.5 font-medium">الصيغ المدعومة: JPEG, PNG, WebP (الحد الأقصى 500KB والأبعاد 1280x720 بحد أقصى)</p>
                      </div>

                      {/* Gallery Grid */}
                      {(hallForm.images && hallForm.images.length > 0) && (
                        <div className="mt-2.5 p-3 bg-slate-50 border border-slate-150 rounded-2xl">
                          <p className="text-[10px] font-bold text-slate-700 mb-2 flex items-center justify-between">
                            <span>الصور المرفوعة المعروضة ({hallForm.images.length} / 10):</span>
                            <span className="text-[9px] text-amber-600 font-medium">الصورة الأولى هي الصورة الأساسية للغلاف</span>
                          </p>
                          <div className="grid grid-cols-5 gap-2">
                            {hallForm.images.map((imgUrl: string, idx: number) => {
                              const isPrimary = idx === 0;
                              return (
                                <div key={idx} className={`relative group aspect-square rounded-lg overflow-hidden border ${isPrimary ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-200'} bg-white shadow-sm`}>
                                  <img referrerPolicy="no-referrer" src={imgUrl} className="w-full h-full object-cover" />
                                  
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setHallForm((prev: any) => {
                                        const remaining = (prev.images || []).filter((_: any, i: number) => i !== idx);
                                        return {
                                          ...prev,
                                          images: remaining,
                                          image: remaining[0] || ''
                                        };
                                      });
                                    }}
                                    className="absolute top-1 right-1 bg-red-650 hover:bg-red-700 text-white p-1 rounded-full shadow transition-all duration-200 cursor-pointer z-10"
                                    title="حذف الصورة"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>

                                  {isPrimary ? (
                                    <div className="absolute bottom-0 inset-x-0 bg-amber-500 text-white text-[8px] py-0.5 text-center font-bold">
                                      الأساسية
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setHallForm((prev: any) => {
                                          const list = [...(prev.images || [])];
                                          const [target] = list.splice(idx, 1);
                                          list.unshift(target);
                                          return {
                                            ...prev,
                                            images: list,
                                            image: list[0]
                                          };
                                        });
                                      }}
                                      className="absolute bottom-0 inset-x-0 bg-slate-900/80 hover:bg-slate-900 text-white text-[7px] py-0.5 text-center font-medium opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
                                    >
                                      تعيين كأساسية
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Video Upload Section according to Rule 7 */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Video className="w-4 h-4 text-amber-500" />
                          مقطع فيديو توضيحي للقاعة / المرفق (اختياري)
                        </label>
                        <span className="text-[9px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono">
                          MP4 | max 10MB | max 960x540
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input 
                            type="text" 
                            value={hallForm.videoUrl || ''} 
                            onChange={e => setHallForm({ ...hallForm, videoUrl: e.target.value })} 
                            placeholder="رابط المقطع التوضيحي (MP4) أو رفع ملف..."
                            className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none bg-white focus:border-amber-500 font-mono"
                          />
                        </div>
                        <label className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold px-3 py-2.5 rounded-xl cursor-pointer transition-all flex items-center gap-1 shrink-0">
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>رفع فيديو</span>
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
                                    setHallForm((prev: any) => ({ ...prev, videoUrl: data.url }));
                                    showNotification('success', 'تم رفع مقطع الفيديو بنجاح');
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

                      {hallForm.videoUrl && (
                        <div className="mt-1 flex items-center justify-between text-[10px] text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                          <span className="truncate max-w-[80%] font-mono" dir="ltr">{hallForm.videoUrl}</span>
                          <button 
                            type="button" 
                            onClick={() => setHallForm({ ...hallForm, videoUrl: '' })}
                            className="text-red-600 hover:bg-red-100 p-0.5 rounded"
                          >
                            حذف الفيديو
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Settings */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        حالة المنشأة لدى الإدارة
                        {userRole !== 'admin' && <span className="text-slate-400 font-normal mr-1">(تحكم الإدارة فقط)</span>}
                      </label>
                      <select 
                        disabled={userRole !== 'admin'}
                        value={hallForm.activationStatus || 'مفعل'} 
                        onChange={e => setHallForm({...hallForm, activationStatus: e.target.value})}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none bg-slate-50 focus:border-amber-500 cursor-pointer text-slate-700 font-bold disabled:bg-slate-100 disabled:opacity-85 disabled:cursor-not-allowed"
                      >
                        <option value="مفعل">مفعلة (تظهر للعملاء وبالمخزون)</option>
                        <option value="موقوف">غير مفعلة (مخفية للعملاء ومتاحة للمزود)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">حالة الحجوزات (تحكم المزود)</label>
                      <select 
                        value={hallForm.bookingStatus || 'متاح'} 
                        onChange={e => setHallForm({...hallForm, bookingStatus: e.target.value})}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none bg-slate-50 focus:border-amber-500 cursor-pointer text-slate-700 font-bold"
                      >
                        <option value="متاح">متاح فوراً للحجز</option>
                        <option value="صيانة">صيانة (موقوف وتقبل الظهور مع شارة "تحت الصيانة")</option>
                        <option value="موقوفة">موقوفة (موقوف الحجز وتختفي تماماً من الواجهة)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={hallForm.pledge || false} 
                        onChange={e => setHallForm({...hallForm, pledge: e.target.checked})}
                        className="mt-0.5 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                      />
                      <span className="text-[10px] text-slate-600 leading-normal font-medium">
                        أتعهد أنا الشريك المالك والمصرح للمرفق بأن كافة البيانات الرقمية المدخلة متطابقة وصحيحة مع السجل والتفويض الصادر عن وزارة السياحة والهيئات السعودية المعنية وأتحمل المسؤلية القانونية الناتجة عن أي مستجدات ميدانية مخالفة.
                      </span>
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer controls */}
          <div className="p-4 bg-slate-50 border-t border-slate-150 flex items-center justify-between shrink-0" dir="rtl">
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200/80 hover:text-slate-800 rounded-xl transition-all"
              >
                إلغاء الإجراء
              </button>
              {hallModalStep > 1 && (
                <button
                  type="button"
                  onClick={() => setHallModalStep(prev => prev - 1)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-sm"
                >
                  السابق
                </button>
              )}
            </div>

            <div className="flex gap-2">
              {hallModalStep < 5 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (hallModalStep === 1 && !hallForm.name) {
                      alert("الرجاء تعبئة اسم المرفق بالخطوة الأولى للتنقل بين المراحل");
                      return;
                    }
                    setHallModalStep(prev => prev + 1);
                  }}
                  className="px-5 py-2 text-xs font-bold bg-amber-50 text-amber-800 hover:bg-amber-100/90 border border-amber-200/50 rounded-xl transition-all"
                >
                  التالي
                </button>
              ) : null}

              {hallModalStep === 5 && (
                <button 
                  onClick={async () => {
                    if (!hallForm.name) {
                      setHallModalStep(1);
                      setTimeout(() => alert("الرجاء المباشرة بتسمية المكان بالخطوة الأولى لحفظ السجلات"), 100);
                      return;
                    }
                    if (!hallForm.pledge) {
                      alert("يرجى مراجعة التعهد والالتزام بالاتفاقية لإتمام الحفظ");
                      return;
                    }

                    const newHallPayload = {
                      name: hallForm.name,
                      category: hallForm.category || 'قاعة أفراح',
                      description: hallForm.description || '',
                      providerType: hallForm.providerType || 'منشأة',
                      crNumber: hallForm.crNumber || '',
                      crExpiryDate: hallForm.crExpiryDate || '',
                      phone: hallForm.phone || '',
                      email: hallForm.email || '',
                      taxNumber: hallForm.taxNumber || '',
                      region: hallForm.region || '',
                      city: hallForm.city || '',
                      nationalAddress: hallForm.nationalAddress || '',
                      extraAddress: hallForm.extraAddress || '',
                      capacity: Number(hallForm.capacity) || 0,
                      nightPrice: Number(hallForm.nightPrice) || 0,
                      morningPrice: Number(hallForm.morningPrice) || 0,
                      fullDayPrice: Number(hallForm.fullDayPrice) || 0,
                      price: Number(hallForm.nightPrice || hallForm.fullDayPrice || 0),
                      status: (hallForm.status === 'approved' || hallForm.status === 'blocked' || hallForm.status === 'pending') ? hallForm.status : (userRole === 'admin' ? 'approved' : 'pending'),
                      activationStatus: hallForm.activationStatus || (userRole === 'admin' ? 'مفعل' : 'موقوف'),
                      bookingStatus: hallForm.bookingStatus || 'متاح',
                      facilities: hallForm.facilities || '',
                      rules: hallForm.rules || '',
                      contractTerms: hallForm.contractTerms || '',
                      pledge: hallForm.pledge,
                      rating: Number(hallForm.rating) || 4.5,
                      reviewsCount: Number(hallForm.reviewsCount) || 0,
                      cancellationPeriod: isNaN(parseInt(String(hallForm.cancellationPeriod), 10)) ? null : parseInt(String(hallForm.cancellationPeriod), 10),
                      hostName: hallForm.hostName || currentUserName,
                      provider: hallForm.provider || '',
                      image: (hallForm.images && hallForm.images.length > 0) ? hallForm.images[0] : (hallForm.image || ''),
                      images: hallForm.images || [],
                      features: hallForm.features || [],
                      location: hallForm.location || `${hallForm.region || ''} - ${hallForm.city || ''} ${hallForm.nationalAddress || ''}`,
                      extraServicesList: hallForm.extraServicesList || [],
                      reviews: editingItem?.reviews || [],
                      availableDays: editingItem?.availableDays || [],
                      featured: editingItem?.featured !== undefined ? editingItem.featured : false
                    };

                    try {
                      let savedHall;
                      if (editingItem) {
                        const res = await fetch(`/api/bookings/halls/${editingItem.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(newHallPayload)
                        });
                        if (!res.ok) throw new Error('فشل الحفظ والتحديث في قاعدة البيانات الخارجية');
                        savedHall = await res.json();
                        
                        const updatedHall = {
                          ...hallForm,
                          ...savedHall,
                          id: savedHall.id,
                        };
                        setHalls(halls.map((h: any) => h.id === editingItem.id ? updatedHall : h));
                        showNotification('success', 'تم حفظ وتزامن تعديلات المرفق بنجاح!');
                      } else {
                        const res = await fetch('/api/bookings/halls', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(newHallPayload)
                        });
                        if (!res.ok) throw new Error('فشل إرسال وإدراج المرفق الجديد بقاعدة البيانات الخارجية');
                        savedHall = await res.json();

                        const addedHall = {
                          ...hallForm,
                          ...savedHall,
                          id: savedHall.id,
                        };
                        setHalls([addedHall, ...halls]);
                        showNotification('success', 'تم تسجيل وإيداع المرفق الجديد بالمنظومة بنجاح!');
                      }
                      onClose();
                    } catch (err: any) {
                      showNotification('error', 'خطأ في معالجة طلب المرفق: ' + err.message);
                    }
                  }} 
                  className="px-6 py-2.5 text-xs font-bold bg-amber-500 hover:bg-amber-650 text-slate-950 rounded-xl transition-all shadow-md shadow-amber-500/10"
                >
                  {editingItem ? 'حفظ وحقن البيانات' : 'تأكيد وإدراج المرفق فوراً'}
                </button>
              )}
            </div>
          </div>

        </div>

        <MediaDimensionsHelperModal 
          isOpen={showMediaGuideModal} 
          onClose={() => setShowMediaGuideModal(false)} 
        />

        {/* Venue Store Manager Modal */}
        <VenueStoreManagerModal 
          isOpen={isStoreManagerOpen}
          onClose={() => setIsStoreManagerOpen(false)}
          hall={editingItem || hallForm}
          onSaveProducts={(hallId, updatedProducts) => {
            setHallForm((prev: any) => ({
              ...prev,
              productsList: updatedProducts
            }));
            if (setHalls) {
              setHalls(prev => prev.map(h => h.id === hallId ? { ...h, productsList: updatedProducts } : h));
            }
          }}
          showNotification={showNotification}
        />
      </div>
    </div>
  );
};
