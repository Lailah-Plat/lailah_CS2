import React, { useState } from 'react';
import { Camera, MapPin, Sparkles, Plus, Lock, Sliders, Package, X, Store } from 'lucide-react';
import { motion } from 'motion/react';
import { safeSetLocalStorage } from '../../../../utils/safeStorage';
import { VenueStoreManagerModal } from '../../../modals/VenueStoreManagerModal';

interface ProviderHallsCatalogProps {
  catalogHalls: any[];
  setCatalogHalls: React.Dispatch<React.SetStateAction<any[]>>;
  showNotification: (type: string, message: string) => void;
  setIsMediaGuideOpen?: (open: boolean) => void;
  showProviderToCustomers?: boolean;
  currentProviderName?: string;
  hasDynamicPricingAccess?: boolean;
  formatCurrency?: (val: number) => string;
}

export const ProviderHallsCatalog: React.FC<ProviderHallsCatalogProps> = ({
  catalogHalls,
  setCatalogHalls,
  showNotification,
  setIsMediaGuideOpen = () => {},
  showProviderToCustomers = true,
  currentProviderName = 'ليالينا للضيافة والاحتفالات',
  hasDynamicPricingAccess = true,
  formatCurrency = (val: number) => typeof val === 'number' ? `${val.toLocaleString('ar-SA')} ر.س` : `${val || ''}`,
}) => {
  // Hall Wizard State
  const [venueWizStep, setVenueWizStep] = useState(1);
  const [venueWizData, setVenueWizData] = useState({
    name: '',
    providerName: currentProviderName || 'ليالينا للضيافة والاحتفالات',
    showProviderToCustomers: true,
    type: 'قصر أفراح',
    contactPhone: '0551234567',
    contactPhone2: '0557654321',
    description: 'قاعة مناسبات كبرى مصممة بأحدث الديكورات العصرية ومجهزة بكافة المرافق الفاخرة لتلائم المناسبات الكبرى وحفلات الزواج.',
    region: 'منطقة الرياض',
    city: 'الرياض',
    nationalAddress: '1234 الملقا، الرياض، المملكة العربية السعودية',
    addressDetails: 'طريق الملك سلمان بن عبدالعزيز، بجانب المجمع التجاري الكبير، مخرج ٤',
    capacity: '400',
    tablesCount: '50',
    chairsCount: '400',
    features: {
      ac: true,
      stage: true,
      ledScreens: false,
      soundSystem: true,
      brideRoom: true,
      parking: true,
    },
    basePrice: '15000',
    securityDeposit: '3000',
    refundPeriod: '14',
    morningPrice: '10000',
    eveningPrice: '15000',
    fullDayPrice: '22000',
    weekendPricingEnabled: true,
    increaseType: 'percentage', // 'percentage' | 'fixed'
    morningIncrease: '10',
    eveningIncrease: '15',
    fullDayIncrease: '12',
    pricingPattern: 'Hybrid', // 'Comprehensive' | 'Individual' | 'Hybrid'
    isTaxExempt: false,
    taxNumber: '301234567800003',
    additionalServicesBundle: 'باقة الضيافة المتكاملة (شامل طاقم تقديم ومفتشات جوال وبخور ممتاز)',
    venueRules: 'يمنع التدخين نهائياً داخل أروقة القاعة، يمنع إدخال الأطفال دون سن السابعة بدون مرافق، يلتزم المستأجر بإنهاء الحفل في الموعد المتفق عليه.',
    contractTerms: 'يلتزم الطرف الأول بتوفير القاعة نظيفة وجاهزة بالمرافق المذكورة، يلتزم الطرف الثاني بسداد مبلغ التأمين وتوقيع العقد النهائي قبل ٣ أيام من الحفل.',
    facilitiesAmenities: 'صالة طعام منفصلة، مصعد خاص لكبار السن والعروس، أجنحة عائلية واسعة، مطبخ تحضيري مجهز بالكامل.',
    cancellationPolicy: 'strict',
    fulfillmentPolicy: 'Hybrid Allowed', // 'Internal Only' | 'Internal Preferred' | 'Hybrid Allowed'
    images: [] as string[],
    closedPackages: [] as Array<{ id: string; name: string; price: string; services: string[]; desc: string }>,
    additionalServices: [] as Array<{ id: string; name: string; price: string; category: string; description: string }>,
    albumImages: [] as Array<{ name: string; size: number; dataUrl: string }>,
    civilDefenseCert: true,
    municipalityLicense: true,
    commercialRegister: true,
    taxCert: true,
    adminStatus: 'معلق بانتظار الاعتماد', // 'معتمدة من الإدارة' | 'معلقة بانتظار الاعتماد' | 'مرفوضة'
    providerStatus: 'نشط ومتاح للعملاء', // 'نشط ومتاح للعملاء' | 'مغلق مؤقتاً'
    pledgeAccuracy: false,
  });

  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgPrice, setNewPkgPrice] = useState('');
  const [newPkgDesc, setNewPkgDesc] = useState('');
  const [newPkgServiceInput, setNewPkgServiceInput] = useState('');
  const [newPkgServices, setNewPkgServices] = useState<string[]>([]);

  const [newAddonName, setNewAddonName] = useState('');
  const [newAddonPrice, setNewAddonPrice] = useState('');
  const [newAddonCategory, setNewAddonCategory] = useState('ضيافة');
  const [newAddonDesc, setNewAddonDesc] = useState('');

  const [isSynthesizingAlbum, setIsSynthesizingAlbum] = useState(false);
  const [synthesisProgress, setSynthesisProgress] = useState(0);
  const [synthesisStepText, setSynthesisStepText] = useState('');

  // Selected Hall for Venue Store Manager Modal
  const [selectedHallForStore, setSelectedHallForStore] = useState<any | null>(null);

  return (
                    <div className="space-y-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-50">
                        <div>
                          <span className="text-[10px] font-black text-slate-400 font-mono block">VENUES & HALLS CATALOG</span>
                          <h3 className="text-sm font-black text-slate-800">قاعات المناسبات التابعة لمجموعة المنشأة</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsMediaGuideOpen(true)}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-950 text-emerald-300 font-extrabold text-xs flex items-center gap-2 border border-emerald-500/40 shadow-sm transition-all active:scale-95 cursor-pointer"
                          title="فتح دليل واشتراطات تصوير ورفع الوسائط (الصور والفيديوهات)"
                        >
                          <Camera className="w-4 h-4 text-emerald-400" />
                          <span>دليل تصوير ورفع الوسائط 📷</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {catalogHalls.map((h) => (
                          <div key={h.id} className="border border-slate-100 rounded-2xl p-4 hover:border-indigo-100 transition-all space-y-3">
                            <div className="flex justify-between items-start">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${h.status === 'Pending Approval' || h.status === 'معلق بانتظار الاعتماد' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                                {h.status || 'معتمد'}
                              </span>
                              <h4 className="text-sm font-black text-slate-800">{h.name}</h4>
                            </div>
                            <p className="text-xs text-slate-500 min-h-12 leading-relaxed">{h.description || 'لا يوجد وصف تفصيلي مسجل للقاعة.'}</p>
                            
                            {/* Real Image Album Preview if custom images are available */}
                            {h.albumImages && h.albumImages.length > 0 && (
                              <div className="space-y-1.5 pt-1">
                                <span className="text-[10px] text-slate-400 font-black block text-right">🖼️ ألبوم صور القاعة:</span>
                                <div className="grid grid-cols-4 gap-1.5">
                                  {h.albumImages.slice(0, 4).map((img: any, idx: number) => (
                                    <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-150 aspect-video">
                                      <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                      {idx === 3 && h.albumImages.length > 4 && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[10px] font-black">
                                          +{h.albumImages.length - 4}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Real Packages Preview if available */}
                            {h.closedPackages && h.closedPackages.length > 0 && (
                              <div className="space-y-1.5 pt-1 bg-purple-50/20 p-2 rounded-xl border border-purple-100/50">
                                <span className="text-[9px] text-purple-700 font-black block text-right">📦 الباقات الشاملة والمغلقة المتاحة ({h.closedPackages.length}):</span>
                                <div className="flex flex-wrap gap-1 justify-end">
                                  {h.closedPackages.map((pkg: any) => (
                                    <span key={pkg.id} className="bg-purple-100 text-purple-800 text-[9px] font-black px-2 py-0.5 rounded-md border border-purple-200" title={pkg.desc}>
                                      {pkg.name} ({parseInt(pkg.price).toLocaleString()} ر.س)
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Real Additional Services Preview if available */}
                            {h.additionalServices && h.additionalServices.length > 0 && (
                              <div className="space-y-1.5 pt-1 bg-indigo-50/20 p-2 rounded-xl border border-indigo-100/50">
                                <span className="text-[9px] text-indigo-700 font-black block text-right">⚙️ الخدمات التكميلية والمساندة التابعة ({h.additionalServices.length}):</span>
                                <div className="flex flex-wrap gap-1 justify-end">
                                  {h.additionalServices.map((addon: any) => (
                                    <span key={addon.id} className="bg-indigo-100 text-indigo-800 text-[9px] font-black px-2 py-0.5 rounded-md border border-indigo-200" title={addon.description}>
                                      {addon.name} ({parseInt(addon.price).toLocaleString()} ر.س)
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-50 text-center text-[10px] font-bold text-slate-500">
                              <div className="bg-slate-50 p-1.5 rounded-lg">
                                <span className="block text-slate-400">السعة الاستيعابية</span>
                                <span className="text-xs font-black text-slate-700 font-mono">{h.capacity || 400} فرد</span>
                              </div>
                              <div className="bg-slate-50 p-1.5 rounded-lg">
                                <span className="block text-slate-400">السياسة اللوجستية</span>
                                <span className="text-xs font-black text-slate-700 truncate block">عامة</span>
                              </div>
                              <div className="bg-slate-50 p-1.5 rounded-lg">
                                <span className="block text-slate-400">معرض الصور</span>
                                <span className="text-xs font-black text-indigo-600 font-mono">{h.photosCount || 3} صور</span>
                              </div>
                            </div>

                            {/* Store Management & Post-Booking Deadline Settings Button */}
                            <div className="pt-2">
                              <button
                                type="button"
                                onClick={() => setSelectedHallForStore(h)}
                                className="w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100/80 text-amber-900 border border-amber-200/80 font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-2xs group"
                              >
                                <Store className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                                <span>إدارة متجر القاعة وضبط المهلة والطلبات اللاحقة ⚙️</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Venue Addition Request Wizard (BOS-Style) */}
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4 mt-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <div className="flex items-center gap-2">
                            <span className="bg-indigo-100 text-indigo-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase font-mono">Lailah Venue Engine v2.6</span>
                            <span className="text-xs text-slate-500">الخطوة {venueWizStep} من ٦</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-indigo-700">
                            <Plus className="w-4 h-4" />
                            <h4 className="text-xs font-black">معالج تقديم طلب إضافة قاعة/مساحة جديدة للمنشأة</h4>
                          </div>
                        </div>

                        {/* Step Progress Indicators */}
                        <div className="grid grid-cols-6 gap-1.5 text-center text-[9px] font-black pb-2">
                          <div className={`p-1.5 rounded-lg transition-all ${venueWizStep === 1 ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-100'}`}>
                            ١. الهوية والتعريف
                          </div>
                          <div className={`p-1.5 rounded-lg transition-all ${venueWizStep === 2 ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-100'}`}>
                            ٢. العناوين والموقع *
                          </div>
                          <div className={`p-1.5 rounded-lg transition-all ${venueWizStep === 3 ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-100'}`}>
                            ٣. السعة والضوابط *
                          </div>
                          <div className={`p-1.5 rounded-lg transition-all ${venueWizStep === 4 ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-100'}`}>
                            ٤. الفترات والويكند
                          </div>
                          <div className={`p-1.5 rounded-lg transition-all ${venueWizStep === 5 ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-100'}`}>
                            ٥. أنماط التسعير والتوثيق
                          </div>
                          <div className={`p-1.5 rounded-lg transition-all ${venueWizStep === 6 ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-100'}`}>
                            ٦. المراجعة والتقديم
                          </div>
                        </div>

                        {/* Step 1: Identification, Provider Name & Description */}
                        {venueWizStep === 1 && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 block">اسم القاعة / المساحة التجاري *</label>
                                <input
                                  type="text"
                                  value={venueWizData.name}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, name: e.target.value })}
                                  placeholder="مثال: قاعة اللؤلؤة الكبرى الملكية"
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-bold text-slate-800"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 block">تصنيف المنشأة *</label>
                                <select
                                  value={venueWizData.type}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, type: e.target.value })}
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-bold text-slate-700"
                                >
                                  <option value="قصر أفراح">قصر أفراح</option>
                                  <option value="قاعة فندقية خمس نجوم">قاعة فندقية خمس نجوم</option>
                                  <option value="استراحة فاخرة">استراحة فاخرة</option>
                                  <option value="منتجع ريفي">منتجع ريفي</option>
                                  <option value="مساحة خارجية مفتوحة">مساحة خارجية مفتوحة</option>
                                  <option value="مساحة مشتركة هجينة">مساحة مشتركة هجينة</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-indigo-50/40 rounded-xl border border-indigo-100/50">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-indigo-900 block">اسم مزود الخدمة المسجل</label>
                                <input
                                  type="text"
                                  value={venueWizData.providerName}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, providerName: e.target.value })}
                                  placeholder="مثال: شركة ليالينا للمناسبات"
                                  className="w-full p-2.5 border border-indigo-200 bg-white rounded-xl text-xs outline-none text-right font-bold text-indigo-950"
                                />
                              </div>
                              <div className="flex flex-col justify-center space-y-1.5 pt-2">
                                <span className="text-[10px] font-black text-indigo-900">خيارات عرض الهوية التجارية للعملاء</span>
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-indigo-950">
                                  <input
                                    type="checkbox"
                                    checked={venueWizData.showProviderToCustomers}
                                    onChange={(e) => setVenueWizData({ ...venueWizData, showProviderToCustomers: e.target.checked })}
                                    className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                  />
                                  إظهار اسم المزود للعملاء في واجهة الاستعراض والبحث العام
                                </label>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 block">جوال للتواصل (رئيسي) *</label>
                                <input
                                  type="text"
                                  value={venueWizData.contactPhone}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, contactPhone: e.target.value })}
                                  placeholder="055XXXXXXX"
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono font-bold text-slate-800"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 block">جوال للتواصل (إضافي / مكرر)</label>
                                <input
                                  type="text"
                                  value={venueWizData.contactPhone2}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, contactPhone2: e.target.value })}
                                  placeholder="055XXXXXXX"
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono font-bold text-slate-800"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-500 block">نبذة تعريفية (الوصف العام للمنشأة) *</label>
                              <textarea
                                value={venueWizData.description}
                                onChange={(e) => setVenueWizData({ ...venueWizData, description: e.target.value })}
                                rows={2.5}
                                placeholder="صف مزايا المنشأة وتجهيزاتها وتفاصيل الأناقة ومساحات الاستقبال الفخمة للعرائس..."
                                className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right text-slate-700 leading-relaxed font-sans"
                              />
                            </div>
                          </motion.div>
                        )}

                        {/* Step 2: Location, National Address & GPS Link */}
                        {venueWizStep === 2 && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 block">المنطقة *</label>
                                <select
                                  value={venueWizData.region}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, region: e.target.value })}
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-bold text-slate-700"
                                >
                                  <option value="منطقة الرياض">منطقة الرياض</option>
                                  <option value="منطقة مكة المكرمة">منطقة مكة المكرمة</option>
                                  <option value="منطقة المدينة المنورة">منطقة المدينة المنورة</option>
                                  <option value="المنطقة الشرقية">المنطقة الشرقية</option>
                                  <option value="منطقة القصيم">منطقة القصيم</option>
                                  <option value="منطقة عسير">منطقة عسير</option>
                                  <option value="منطقة تبوك">منطقة تبوك</option>
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 block">المدينة *</label>
                                <select
                                  value={venueWizData.city}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, city: e.target.value })}
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-bold text-slate-700"
                                >
                                  <option value="الرياض">الرياض</option>
                                  <option value="جدة">جدة</option>
                                  <option value="الدمام">الدمام</option>
                                  <option value="المدينة المنورة">المدينة المنورة</option>
                                  <option value="مكة المكرمة">مكة المكرمة</option>
                                  <option value="الخبر">الخبر</option>
                                  <option value="بريدة">بريدة</option>
                                  <option value="أبها">أبها</option>
                                </select>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-500 block flex items-center gap-1 justify-end">
                                <span>العنوان الوطني / الرابط الإحداثي الفوري للموقع (مثل خرائط Google Map)</span>
                                <MapPin className="w-3.5 h-3.5 text-red-500" />
                              </label>
                              <input
                                type="text"
                                value={venueWizData.nationalAddress}
                                onChange={(e) => setVenueWizData({ ...venueWizData, nationalAddress: e.target.value })}
                                placeholder="مثال: https://maps.google.com/?q=24.1234,46.5678 أو العنوان الوطني: الملقا 4567، الرياض"
                                className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-left font-mono font-bold text-slate-700"
                                dir="ltr"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-500 block">تفصيل العنوان ووصف المعالم القريبة</label>
                              <textarea
                                value={venueWizData.addressDetails}
                                onChange={(e) => setVenueWizData({ ...venueWizData, addressDetails: e.target.value })}
                                rows={2.5}
                                placeholder="مثال: تقاطع طريق الملك سلمان بن عبدالعزيز مع طريق أنس بن مالك، خلف صيدلية الدواء مباشرة، حي الملقا"
                                className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right text-slate-700 font-bold"
                              />
                            </div>
                          </motion.div>
                        )}

                        {/* Step 3: Capacity, Amenities, Additional Packages & Rules */}
                        {venueWizStep === 3 && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 block">سعة الاستيعاب (شخص) *</label>
                                <input
                                  type="number"
                                  value={venueWizData.capacity}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, capacity: e.target.value })}
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono font-bold text-slate-800"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 block">عدد الطاولات المتاحة</label>
                                <input
                                  type="number"
                                  value={venueWizData.tablesCount}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, tablesCount: e.target.value })}
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono font-bold"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 block">عدد الكراسي المتاحة</label>
                                <input
                                  type="number"
                                  value={venueWizData.chairsCount}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, chairsCount: e.target.value })}
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono font-bold"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-500 block">مرافق المنشأة، الضوابط والضمانات التعاقدية</label>
                              <input
                                type="text"
                                value={venueWizData.facilitiesAmenities}
                                onChange={(e) => setVenueWizData({ ...venueWizData, facilitiesAmenities: e.target.value })}
                                placeholder="مثال: صالة طعام مستقلة، مصعد خاص، حراسة أمنية، ضمان سلامة الممتلكات الشخصية"
                                className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-bold text-slate-700"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-500 block">باقة الخدمات الإضافية المتضمنة مع القاعة</label>
                              <input
                                type="text"
                                value={venueWizData.additionalServicesBundle}
                                onChange={(e) => setVenueWizData({ ...venueWizData, additionalServicesBundle: e.target.value })}
                                placeholder="مثال: باقة الضيافة الملكية المتكاملة مع طاقم الخدمة بالبخور الفاخر"
                                className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-bold text-slate-700"
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 block">قواعد وضوابط المكان</label>
                                <textarea
                                  value={venueWizData.venueRules}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, venueRules: e.target.value })}
                                  rows={2}
                                  placeholder="أهم قواعد الحضور والتشغيل..."
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right text-slate-700"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 block">شروط وأحكام العقد</label>
                                <textarea
                                  value={venueWizData.contractTerms}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, contractTerms: e.target.value })}
                                  rows={2}
                                  placeholder="الأحكام القانونية للفسخ والتأخير وسداد الدفعات..."
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right text-slate-700"
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* Step 4: Pricing structure, Weekend surge & Taxes & Refund policies */}
                        {venueWizStep === 4 && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            <div className="bg-slate-100 p-2.5 rounded-xl text-[10px] text-slate-700 leading-relaxed font-bold border border-slate-200">
                              ℹ️ يرجى إدخال أسعار التأجير التفصيلية لفترات اليوم المتاحة لديكم، وتحديد مبالغ التأمين وسياسات الإرجاع بدقة.
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 block">تأجير: الفترة الصباحية (ر.س)</label>
                                <input
                                  type="number"
                                  value={venueWizData.morningPrice}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, morningPrice: e.target.value })}
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono font-bold text-slate-800"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 block">تأجير: الفترة المسائية (ر.س)</label>
                                <input
                                  type="number"
                                  value={venueWizData.eveningPrice}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, eveningPrice: e.target.value })}
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono font-bold text-slate-800"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 block">تأجير: اليوم الكامل (ر.س)</label>
                                <input
                                  type="number"
                                  value={venueWizData.fullDayPrice}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, fullDayPrice: e.target.value })}
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono font-bold text-slate-800"
                                />
                              </div>
                            </div>

                            {/* Weekend Pricing Feature (Dynamic Weekend Multipliers) */}
                            <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-100 space-y-3">
                              <div className="flex items-center justify-between pb-1 border-b border-purple-100">
                                <span className="bg-purple-100 text-purple-700 text-[8px] font-black px-2 py-0.5 rounded-full uppercase font-mono">Advanced Plan Feature</span>
                                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-black text-purple-950">
                                  <input
                                    type="checkbox"
                                    checked={venueWizData.weekendPricingEnabled}
                                    onChange={(e) => setVenueWizData({ ...venueWizData, weekendPricingEnabled: e.target.checked })}
                                    className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                                  />
                                  تسعير عطلة نهاية الأسبوع (الويكند) ميزة تضاف حسب الباقة
                                </label>
                              </div>

                              {venueWizData.weekendPricingEnabled && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-black text-purple-800 block">نوع الزيادة للويكند</label>
                                      <select
                                        value={venueWizData.increaseType}
                                        onChange={(e) => setVenueWizData({ ...venueWizData, increaseType: e.target.value })}
                                        className="w-full p-2 border border-purple-200 bg-white rounded-lg text-[11px] outline-none text-right font-black text-purple-950"
                                      >
                                        <option value="percentage">نسبة مئوية (%)</option>
                                        <option value="fixed">مبلغ ثابت (ر.س)</option>
                                      </select>
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-black text-purple-800 block">الزيادة الصباحية</label>
                                      <input
                                        type="number"
                                        value={venueWizData.morningIncrease}
                                        onChange={(e) => setVenueWizData({ ...venueWizData, morningIncrease: e.target.value })}
                                        className="w-full p-2 border border-purple-200 bg-white rounded-lg text-[11px] outline-none text-right font-mono font-bold"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-black text-purple-800 block">الزيادة المسائية</label>
                                      <input
                                        type="number"
                                        value={venueWizData.eveningIncrease}
                                        onChange={(e) => setVenueWizData({ ...venueWizData, eveningIncrease: e.target.value })}
                                        className="w-full p-2 border border-purple-200 bg-white rounded-lg text-[11px] outline-none text-right font-mono font-bold"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-black text-purple-800 block">زيادة اليوم الكامل</label>
                                      <input
                                        type="number"
                                        value={venueWizData.fullDayIncrease}
                                        onChange={(e) => setVenueWizData({ ...venueWizData, fullDayIncrease: e.target.value })}
                                        className="w-full p-2 border border-purple-200 bg-white rounded-lg text-[11px] outline-none text-right font-mono font-bold"
                                      />
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </div>

                            {/* Taxes and Security Deposits */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 block">فترة استرجاع العميل (يوم) *</label>
                                <input
                                  type="number"
                                  value={venueWizData.refundPeriod}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, refundPeriod: e.target.value })}
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono font-bold text-slate-800"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 block">مبلغ التأمين المسترد (ر.س) *</label>
                                <input
                                  type="number"
                                  value={venueWizData.securityDeposit}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, securityDeposit: e.target.value })}
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono font-bold text-slate-800"
                                />
                              </div>
                            </div>

                            <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100/50 flex flex-col md:flex-row items-center justify-between gap-3">
                              <div className="flex items-center gap-1.5 cursor-pointer text-xs font-black text-indigo-950">
                                <input
                                  type="checkbox"
                                  checked={venueWizData.isTaxExempt}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, isTaxExempt: e.target.checked })}
                                  className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                />
                                زر تبديل الإعفاء للتصريح الضريبي للمنشأة
                              </div>
                              {!venueWizData.isTaxExempt && (
                                <div className="w-full md:w-auto flex items-center gap-2">
                                  <span className="text-[10px] font-black text-slate-500 whitespace-nowrap">الرقم الضريبي للمنشأة (VAT):</span>
                                  <input
                                    type="text"
                                    value={venueWizData.taxNumber}
                                    onChange={(e) => setVenueWizData({ ...venueWizData, taxNumber: e.target.value })}
                                    placeholder="30XXXXXXXXXXXXX"
                                    className="p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none text-center font-mono font-bold text-slate-800 w-44"
                                  />
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}

                        {/* Step 5: Pricing Patterns, Documents, Statuses & Legal Pledge */}
                        {venueWizStep === 5 && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            {/* Pricing Pattern & Service Synthesis */}
                            <div className="space-y-1.5 bg-indigo-50/40 p-4 rounded-xl border border-indigo-100/50">
                              <label className="text-[11px] font-black text-indigo-950 block flex items-center gap-1 justify-end">
                                <span>أنماط التسعير وتوليف خدمات المنصة والتكامل المالي</span>
                                <Sparkles className="w-4 h-4 text-indigo-600" />
                              </label>
                              <div className="grid grid-cols-1 gap-2.5 mt-2">
                                <label className="flex items-center gap-3 bg-white p-3 rounded-xl border border-indigo-100 cursor-pointer hover:bg-indigo-50/20 transition-all text-xs font-bold text-slate-800">
                                  <input
                                    type="radio"
                                    name="pricingPattern"
                                    checked={venueWizData.pricingPattern === 'Comprehensive'}
                                    onChange={() => setVenueWizData({ ...venueWizData, pricingPattern: 'Comprehensive' })}
                                    className="text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                  />
                                  <div>
                                    <span className="block font-black text-indigo-950">الباقات الشاملة والمغلقة</span>
                                    <span className="text-[10px] text-slate-400 font-medium">حزم تسعير متكاملة مغلقة تشمل المكان وكافة الخدمات بصفقة واحدة غير قابلة للتجزئة.</span>
                                  </div>
                                </label>
                                <label className="flex items-center gap-3 bg-white p-3 rounded-xl border border-indigo-100 cursor-pointer hover:bg-indigo-50/20 transition-all text-xs font-bold text-slate-800">
                                  <input
                                    type="radio"
                                    name="pricingPattern"
                                    checked={venueWizData.pricingPattern === 'Individual'}
                                    onChange={() => setVenueWizData({ ...venueWizData, pricingPattern: 'Individual' })}
                                    className="text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                  />
                                  <div>
                                    <span className="block font-black text-indigo-950">الخدمات المنفردة الاختيارية</span>
                                    <span className="text-[10px] text-slate-400 font-medium">حجز القاعة كعنصر مجرد مع تمكين العميل من شراء واختيار خدمات إضافية منفردة حسب الحاجة.</span>
                                  </div>
                                </label>
                                <label className="flex items-center gap-3 bg-white p-3 rounded-xl border border-indigo-100 cursor-pointer hover:bg-indigo-50/20 transition-all text-xs font-bold text-slate-800">
                                  <input
                                    type="radio"
                                    name="pricingPattern"
                                    checked={venueWizData.pricingPattern === 'Hybrid'}
                                    onChange={() => setVenueWizData({ ...venueWizData, pricingPattern: 'Hybrid' })}
                                    className="text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                  />
                                  <div>
                                    <span className="block font-black text-indigo-950">الهجين وتفعيل الخدمات الخارجية</span>
                                    <span className="text-[10px] text-slate-400 font-medium">السماح بتمرير الخدمات الخارجية وتفعيل دمج شركاء المنصة المستقلين مع خدمات المكان العامة.</span>
                                  </div>
                                </label>
                              </div>
                            </div>

                            {/* Comprehensive closed packages inventory & creation */}
                            {venueWizData.pricingPattern === 'Comprehensive' && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }} 
                                animate={{ opacity: 1, height: 'auto' }} 
                                className="space-y-4 bg-purple-50/40 p-4 rounded-xl border border-purple-100"
                              >
                                <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                                  <span className="bg-purple-100 text-purple-700 text-[9px] font-black px-2.5 py-1 rounded-full uppercase font-mono">Package Inventory</span>
                                  <h4 className="text-xs font-black text-purple-950 flex items-center gap-1.5 justify-end">
                                    <span>مستودع الباقات المغلقة والجاهزة (الشاملة)</span>
                                    <Package className="w-4 h-4 text-purple-600" />
                                  </h4>
                                </div>

                                {/* Packages List */}
                                <div className="space-y-2">
                                  {venueWizData.closedPackages && venueWizData.closedPackages.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {venueWizData.closedPackages.map((pkg) => (
                                        <div key={pkg.id} className="bg-white p-3.5 rounded-xl border border-purple-100 hover:shadow-sm transition-all space-y-2 relative">
                                          <button 
                                            type="button"
                                            onClick={() => {
                                              setVenueWizData({
                                                ...venueWizData,
                                                closedPackages: venueWizData.closedPackages.filter(p => p.id !== pkg.id)
                                              });
                                              showNotification('info', `تم حذف الباقة: ${pkg.name}`);
                                            }}
                                            className="absolute top-3 left-3 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-all cursor-pointer"
                                            title="حذف الباقة"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                          
                                          <div className="text-right pl-6">
                                            <span className="bg-purple-50 text-purple-700 text-[8px] font-black px-2 py-0.5 rounded-full font-mono">{pkg.id}</span>
                                            <h5 className="font-black text-purple-950 text-xs mt-1">{pkg.name}</h5>
                                            <span className="text-xs font-mono font-black text-emerald-600 block mt-0.5">{parseInt(pkg.price).toLocaleString()} ر.س</span>
                                            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed font-sans font-medium">{pkg.desc || 'لا يوجد وصف مضاف للباقة.'}</p>
                                          </div>
                                          
                                          {pkg.services && pkg.services.length > 0 && (
                                            <div className="pt-2 border-t border-slate-50 flex flex-wrap gap-1 justify-end">
                                              {pkg.services.map((ser, i) => (
                                                <span key={i} className="bg-slate-50 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-md border border-slate-100">
                                                  {ser}
                                                </span>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="bg-white/50 p-6 rounded-xl border border-dashed border-purple-150 text-center space-y-1">
                                      <span className="block text-[11px] font-black text-purple-900">لا توجد باقات جاهزة في المستودع حالياً</span>
                                      <p className="text-[10px] text-slate-400 font-medium">قم بتدشين باقتك الأولى المغلقة عبر النموذج أدناه لتضمينها مع طلب القاعة.</p>
                                    </div>
                                  )}
                                </div>

                                {/* Add New Package Form */}
                                <div className="bg-white p-4 rounded-xl border border-purple-100 space-y-3 text-right">
                                  <span className="block text-[10px] font-black text-purple-950 border-b pb-1.5 mb-1 text-right">⚙️ إضافة باقة شاملة ومغلقة جديدة للمستودع</span>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-black text-slate-500 block text-right">اسم الباقة الفريدة *</label>
                                      <input 
                                        type="text"
                                        value={newPkgName}
                                        onChange={(e) => setNewPkgName(e.target.value)}
                                        placeholder="مثال: باقة الأفراح الماسية المتكاملة"
                                        className="w-full p-2 border border-slate-200 bg-slate-50/50 rounded-xl text-xs outline-none text-right font-bold text-slate-800"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-black text-slate-500 block text-right">سعر الباقة الشاملة (ر.س) *</label>
                                      <input 
                                        type="number"
                                        value={newPkgPrice}
                                        onChange={(e) => setNewPkgPrice(e.target.value)}
                                        placeholder="مثال: 25000"
                                        className="w-full p-2 border border-slate-200 bg-slate-50/50 rounded-xl text-xs outline-none text-right font-mono font-bold text-slate-800"
                                      />
                                    </div>
                                  </div>

                                  {/* Services/Features list tag input */}
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 block text-right">الخدمات والمزايا المتضمنة مع الباقة *</label>
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (!newPkgServiceInput.trim()) return;
                                          if (newPkgServices.includes(newPkgServiceInput.trim())) {
                                            showNotification('warning', 'هذه الخدمة مضافة بالفعل.');
                                            return;
                                          }
                                          setNewPkgServices([...newPkgServices, newPkgServiceInput.trim()]);
                                          setNewPkgServiceInput('');
                                        }}
                                        className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl cursor-pointer"
                                      >
                                        أضف
                                      </button>
                                      <input 
                                        type="text"
                                        value={newPkgServiceInput}
                                        onChange={(e) => setNewPkgServiceInput(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            if (!newPkgServiceInput.trim()) return;
                                            setNewPkgServices([...newPkgServices, newPkgServiceInput.trim()]);
                                            setNewPkgServiceInput('');
                                          }
                                        }}
                                        placeholder="اكتب خدمة أو ميزة (مثل: بوفيه عشاء ملكي، تصوير فيديو، إلخ) ثم اضغط زر الإضافة"
                                        className="w-full p-2 border border-slate-200 bg-slate-50/50 rounded-xl text-xs outline-none text-right text-slate-800 font-bold flex-1"
                                      />
                                    </div>

                                    {/* Pre-configured Quick Suggestions */}
                                    <div className="flex flex-wrap gap-1.5 justify-end pt-1">
                                      {['بوفيه عشاء مفتوح', 'كوشة وتنسيق ورود طبيعية', 'طاقم ضيافة نسائي VIP', 'تصوير فوتوغرافي وفيديو', 'تغطية دي جي وإضاءة متحركة', 'جناح لغرفة العروس'].map((suggestion) => (
                                        <button
                                          key={suggestion}
                                          type="button"
                                          onClick={() => {
                                            if (newPkgServices.includes(suggestion)) return;
                                            setNewPkgServices([...newPkgServices, suggestion]);
                                          }}
                                          className="text-[9px] font-black bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-purple-700 px-2.5 py-1 rounded-full border border-slate-200 cursor-pointer transition-all"
                                        >
                                          + {suggestion}
                                        </button>
                                      ))}
                                    </div>

                                    {/* Added Features Grid */}
                                    {newPkgServices.length > 0 && (
                                      <div className="flex flex-wrap gap-1.5 justify-end p-2 bg-slate-50 rounded-xl border border-slate-200/50 mt-1">
                                        {newPkgServices.map((ser, idx) => (
                                          <span key={idx} className="bg-purple-50 text-purple-700 text-[10px] font-black px-2.5 py-1 rounded-lg border border-purple-100/60 flex items-center gap-1.5">
                                            <button 
                                              type="button"
                                              onClick={() => setNewPkgServices(newPkgServices.filter((_, i) => i !== idx))}
                                              className="text-red-500 hover:text-red-700 font-black text-xs"
                                            >
                                              ×
                                            </button>
                                            <span>{ser}</span>
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 block text-right">وصف الباقة وشروط الاستفادة</label>
                                    <textarea 
                                      value={newPkgDesc}
                                      onChange={(e) => setNewPkgDesc(e.target.value)}
                                      rows={2}
                                      placeholder="اكتب تفاصيل إضافية عن شروط العرض، أو سياسة الإلغاء للباقة، أو مبررات الأسعار الشاملة لليلة المناسبة..."
                                      className="w-full p-2 border border-slate-200 bg-slate-50/50 rounded-xl text-xs outline-none text-right text-slate-800"
                                    />
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!newPkgName.trim()) {
                                        showNotification('warning', 'يرجى إدخال اسم الباقة.');
                                        return;
                                      }
                                      if (!newPkgPrice.trim()) {
                                        showNotification('warning', 'يرجى إدخال سعر الباقة.');
                                        return;
                                      }
                                      if (newPkgServices.length === 0) {
                                        showNotification('warning', 'يرجى إدخال ميزة أو خدمة واحدة متضمنة على الأقل.');
                                        return;
                                      }

                                      // Generate a package ID format like PKG-YY-00000001
                                      const currentYear = new Date().getFullYear().toString().slice(-2);
                                      const sequentialNum = String((venueWizData.closedPackages?.length || 0) + 1).padStart(8, '0');
                                      const pkgId = `PKG-${currentYear}-${sequentialNum}`;

                                      const newPkg = {
                                        id: pkgId,
                                        name: newPkgName.trim(),
                                        price: newPkgPrice.trim(),
                                        services: [...newPkgServices],
                                        desc: newPkgDesc.trim()
                                      };

                                      setVenueWizData({
                                        ...venueWizData,
                                        closedPackages: [...(venueWizData.closedPackages || []), newPkg]
                                      });

                                      // Reset fields
                                      setNewPkgName('');
                                      setNewPkgPrice('');
                                      setNewPkgDesc('');
                                      setNewPkgServices([]);
                                      setNewPkgServiceInput('');

                                      showNotification('success', `تم تدشين الباقة الشاملة "${newPkg.name}" وحفظها في مستودع المنشأة بالرقم ${newPkg.id}`);
                                    }}
                                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                  >
                                    <Plus className="w-4 h-4" />
                                    <span>إضافة الباقة وحفظها في مستودع المنشأة</span>
                                  </button>
                                </div>
                              </motion.div>
                            )}

                            {/* Complementary Addons (الخدمات الإضافية التكميلية للقاعة إن وجد) */}
                            <div className="space-y-4 bg-indigo-50/20 p-4 rounded-xl border border-indigo-100">
                              <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                                <span className="bg-indigo-100 text-indigo-700 text-[9px] font-black px-2.5 py-1 rounded-full uppercase font-mono">Complementary Addons</span>
                                <h4 className="text-xs font-black text-indigo-950 flex items-center gap-1.5 justify-end">
                                  <span>الخدمات الإضافية التكميلية والمساندة التابعة للقاعة (إن وجد)</span>
                                  <Sliders className="w-4 h-4 text-indigo-600" />
                                </h4>
                              </div>

                              {/* Addons List */}
                              <div className="space-y-2">
                                {venueWizData.additionalServices && venueWizData.additionalServices.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {venueWizData.additionalServices.map((addon) => (
                                      <div key={addon.id} className="bg-white p-3.5 rounded-xl border border-indigo-100 hover:shadow-sm transition-all space-y-2 relative">
                                        <button 
                                          type="button"
                                          onClick={() => {
                                            setVenueWizData({
                                              ...venueWizData,
                                              additionalServices: (venueWizData.additionalServices || []).filter(a => a.id !== addon.id)
                                            });
                                            showNotification('info', `تم حذف الخدمة التكميلية: ${addon.name}`);
                                          }}
                                          className="absolute top-3 left-3 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-all cursor-pointer"
                                          title="حذف الخدمة"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                        
                                        <div className="text-right pl-6 font-sans">
                                          <div className="flex items-center justify-between">
                                            <span className="bg-indigo-50 text-indigo-700 text-[8px] font-black px-2 py-0.5 rounded-full font-mono">{addon.id}</span>
                                            <span className="bg-slate-100 text-slate-700 text-[8px] font-black px-2 py-0.5 rounded-full">{addon.category}</span>
                                          </div>
                                          <h5 className="font-black text-indigo-950 text-xs mt-1">{addon.name}</h5>
                                          <span className="text-xs font-mono font-black text-emerald-600 block mt-0.5">{parseInt(addon.price).toLocaleString()} ر.س</span>
                                          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed font-sans font-medium">{addon.description || 'لا يوجد وصف مضاف للخدمة.'}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="bg-white/50 p-6 rounded-xl border border-dashed border-indigo-150 text-center space-y-1">
                                    <span className="block text-[11px] font-black text-indigo-900">لا توجد خدمات إضافية تكميلية تابعة للقاعة مضافة حالياً</span>
                                    <p className="text-[10px] text-slate-400 font-medium">يمكنك تدشين خدمات تكميلية اختيارية تابعة للمنشأة مباشرة (مثل الضيافة الإضافية، التصوير، كشافات ومؤثرات) من هنا.</p>
                                  </div>
                                )}
                              </div>

                              {/* Add New Addon Form */}
                              <div className="bg-white p-4 rounded-xl border border-indigo-100 space-y-3 text-right">
                                <span className="block text-[10px] font-black text-indigo-950 border-b pb-1.5 mb-1 text-right">⚙️ إضافة خدمة تكميلية ومساندة تابعة للمنشأة</span>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 block text-right">اسم الخدمة التكميلية *</label>
                                    <input 
                                      type="text"
                                      value={newAddonName}
                                      onChange={(e) => setNewAddonName(e.target.value)}
                                      placeholder="مثال: طاقم تقديم قهوة وشاي VIP نسائي"
                                      className="w-full p-2 border border-slate-200 bg-slate-50/50 rounded-xl text-xs outline-none text-right font-bold text-slate-800"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 block text-right">سعر الخدمة التكميلية (ر.س) *</label>
                                    <input 
                                      type="number"
                                      value={newAddonPrice}
                                      onChange={(e) => setNewAddonPrice(e.target.value)}
                                      placeholder="مثال: 1500"
                                      className="w-full p-2 border border-slate-200 bg-slate-50/50 rounded-xl text-xs outline-none text-right font-mono font-bold text-slate-800"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 block text-right">فئة الخدمة التكميلية *</label>
                                    <select
                                      value={newAddonCategory}
                                      onChange={(e) => setNewAddonCategory(e.target.value)}
                                      className="w-full p-2 border border-slate-200 bg-slate-50/50 rounded-xl text-xs outline-none text-right font-bold text-slate-700"
                                    >
                                      <option value="ضيافة">ضيافة وتأمين الأطعمة</option>
                                      <option value="تصوير">توثيق وتصوير فوتوغرافي/فيديو</option>
                                      <option value="ديكور">تنسيق ديكور وممرات وورود</option>
                                      <option value="إضاءة وصوت">أجهزة إضاءة ومؤثرات وصوتيات</option>
                                      <option value="أمن وحراسة">حراسة أمنية وتنظيم لوجستي</option>
                                      <option value="أخرى">خدمات أخرى تكميلية</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-500 block text-right">الوصف التفصيلي للخدمة ومميزاتها</label>
                                  <textarea 
                                    value={newAddonDesc}
                                    onChange={(e) => setNewAddonDesc(e.target.value)}
                                    rows={1.5}
                                    placeholder="صف تفاصيل الخدمة التكميلية (مثل: عدد طاقم الضيافة، الأدوات المستخدمة، الالتزام بالوقت...)"
                                    className="w-full p-2 border border-slate-200 bg-slate-50/50 rounded-xl text-xs outline-none text-right text-slate-800"
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!newAddonName.trim()) {
                                      showNotification('warning', 'يرجى إدخال اسم الخدمة التكميلية.');
                                      return;
                                    }
                                    if (!newAddonPrice.trim()) {
                                      showNotification('warning', 'يرجى إدخال سعر الخدمة التكميلية.');
                                      return;
                                    }

                                    // Generate a service request ID format like SRV-YY-00000001
                                    const currentYear = new Date().getFullYear().toString().slice(-2);
                                    const sequentialNum = String(((venueWizData.additionalServices || []).length) + 1).padStart(8, '0');
                                    const addonId = `SRV-${currentYear}-${sequentialNum}`;

                                    const newAddon = {
                                      id: addonId,
                                      name: newAddonName.trim(),
                                      price: newAddonPrice.trim(),
                                      category: newAddonCategory,
                                      description: newAddonDesc.trim()
                                    };

                                    setVenueWizData({
                                      ...venueWizData,
                                      additionalServices: [...(venueWizData.additionalServices || []), newAddon]
                                    });

                                    // Reset addon fields
                                    setNewAddonName('');
                                    setNewAddonPrice('');
                                    setNewAddonDesc('');
                                    setNewAddonCategory('ضيافة');

                                    showNotification('success', `تم تدشين الخدمة التكميلية للقاعة "${newAddon.name}" بنجاح بالرمز ${newAddon.id}`);
                                  }}
                                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <Plus className="w-4 h-4" />
                                  <span>إضافة الخدمة التكميلية وتأكيد ربطها بالقاعة</span>
                                </button>
                              </div>
                            </div>

                            {/* Hall Photo Album (توليف وتدشين ألبوم الصور) */}
                            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                              <div className="flex items-center justify-between pb-1.5 border-b mb-2">
                                <span className="bg-indigo-50 text-indigo-700 text-[8px] font-black px-2 py-0.5 rounded-full font-mono">Media Synthesis Engine</span>
                                <h4 className="text-[11px] font-black text-slate-800 flex items-center gap-1 justify-end">
                                  <span>تدشين وتوليف ألبوم صور القاعة الشامل</span>
                                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                </h4>
                              </div>

                              <p className="text-[10px] text-slate-400 text-right leading-relaxed font-medium">
                                قم برفع مجموعة مميزة من صور القاعة لتمثيلها في العرض العام. يدعم صيغ <strong className="text-slate-600">PNG, JPG, WEBP</strong> بحد أقصى <strong className="text-slate-600">500KB للواحدة</strong>. يمكنك تحديد عدة صور معاً للرفع الفوري والتدشين بنقرة واحدة.
                              </p>

                              {/* Upload Dropzone */}
                              <div className="relative">
                                <input 
                                  type="file"
                                  id="venue-album-upload"
                                  multiple
                                  accept=".png, .jpg, .jpeg, .webp"
                                  onChange={(e) => {
                                    const files = Array.from(e.target.files || []);
                                    if (files.length === 0) return;

                                    const validFiles: File[] = [];
                                    const maxSizeBytes = 500 * 1024; // 500KB
                                    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

                                    for (const file of files) {
                                      const ext = file.name.split('.').pop()?.toLowerCase();
                                      const isAllowedExt = ['png', 'jpg', 'jpeg', 'webp'].includes(ext || '');
                                      const isAllowedType = allowedTypes.includes(file.type) || isAllowedExt;

                                      if (!isAllowedType) {
                                        showNotification('error', `ملف غير مدعوم: ${file.name}. يدعم فقط صيغ (PNG, JPG, WEBP).`);
                                        continue;
                                      }

                                      if (file.size > maxSizeBytes) {
                                        showNotification('error', `حجم الملف يتعدى 500KB: ${file.name} (الحجم: ${Math.round(file.size / 1024)}KB).`);
                                        continue;
                                      }

                                      validFiles.push(file);
                                    }

                                    if (validFiles.length === 0) return;

                                    setIsSynthesizingAlbum(true);
                                    setSynthesisProgress(0);
                                    setSynthesisStepText('بدء تشفير وتوليف ألبوم صور القاعة...');

                                    const steps = [
                                      { progress: 25, text: 'تحليل أبعاد الصور والتحقق من التراخيص الرقمية للترميز...' },
                                      { progress: 55, text: 'تقليص وضغط حجم الصور لتحسين سرعة تحميل العميل للحد الأقصى...' },
                                      { progress: 85, text: 'تشفير وحقن ألبوم الصور في مخزن الهوية السحابي التابع للمنصة...' },
                                      { progress: 100, text: 'تم توليف وتدشين ألبوم صور القاعة بنجاح في الوقت الحقيقي!' }
                                    ];

                                    let stepIdx = 0;
                                    const interval = setInterval(() => {
                                      if (stepIdx < steps.length) {
                                        setSynthesisProgress(steps[stepIdx].progress);
                                        setSynthesisStepText(steps[stepIdx].text);
                                        stepIdx++;
                                      } else {
                                        clearInterval(interval);
                                        
                                        let loadedCount = 0;
                                        const newImagesList: Array<{ name: string; size: number; dataUrl: string }> = [];

                                        validFiles.forEach((file) => {
                                          const reader = new FileReader();
                                          reader.onload = (event) => {
                                            if (event.target?.result) {
                                              newImagesList.push({
                                                name: file.name,
                                                size: file.size,
                                                dataUrl: event.target.result as string
                                              });
                                            }
                                            loadedCount++;
                                            if (loadedCount === validFiles.length) {
                                              setVenueWizData(prev => ({
                                                ...prev,
                                                albumImages: [...(prev.albumImages || []), ...newImagesList]
                                              }));
                                              setIsSynthesizingAlbum(false);
                                              showNotification('success', `تم توليف وتدشين عدد ${validFiles.length} صور في ألبوم القاعة بنجاح!`);
                                            }
                                          };
                                          reader.readAsDataURL(file);
                                        });
                                      }
                                    }, 400);
                                  }}
                                  className="hidden"
                                />
                                <label 
                                  htmlFor="venue-album-upload"
                                  className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/10 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2 group"
                                >
                                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-all">
                                    <Plus className="w-5 h-5" />
                                  </div>
                                  <span className="text-xs font-black text-slate-700">اضغط هنا لتحديد عدة صور معاً من جهازك</span>
                                  <span className="text-[9px] text-slate-400">يدعم تنسيق PNG, JPG, WEBP بحد أقصى 500KB لكل صورة</span>
                                </label>
                              </div>

                              {/* Loading/Synthesis Progress state */}
                              {isSynthesizingAlbum && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-indigo-50/40 rounded-xl border border-indigo-100 space-y-2 text-right">
                                  <div className="flex justify-between items-center text-[10px] font-black text-indigo-950 font-mono">
                                    <span>{synthesisProgress}%</span>
                                    <span>{synthesisStepText}</span>
                                  </div>
                                  <div className="w-full bg-slate-150 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${synthesisProgress}%` }}></div>
                                  </div>
                                </motion.div>
                              )}

                              {/* Album Preview Grid */}
                              {venueWizData.albumImages && venueWizData.albumImages.length > 0 && (
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center text-[9px] font-black text-slate-400 px-1 pt-1">
                                    <button 
                                      type="button" 
                                      onClick={() => {
                                        setVenueWizData(prev => ({ ...prev, albumImages: [] }));
                                        showNotification('info', 'تم إفراغ ألبوم الصور بالكامل.');
                                      }}
                                      className="text-red-500 hover:underline"
                                    >
                                      إفراغ الألبوم
                                    </button>
                                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-mono text-[9px]">ألبوم الصور الملحق: {venueWizData.albumImages.length} صور</span>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                    {venueWizData.albumImages.map((img, index) => (
                                      <div key={index} className="relative group rounded-xl overflow-hidden border border-slate-200/60 aspect-video bg-slate-50 shadow-sm">
                                        <img 
                                          src={img.dataUrl} 
                                          alt={img.name} 
                                          className="w-full h-full object-cover" 
                                          referrerPolicy="no-referrer"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col justify-between p-2">
                                          <div className="flex justify-between">
                                            <button 
                                              type="button"
                                              onClick={() => {
                                                setVenueWizData(prev => ({
                                                  ...prev,
                                                  albumImages: prev.albumImages.filter((_, idx) => idx !== index)
                                                }));
                                                showNotification('info', `تم حذف الصورة: ${img.name}`);
                                              }}
                                              className="p-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all cursor-pointer"
                                              title="حذف"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                            <span className="text-[8px] text-white font-mono bg-indigo-950/80 px-1 py-0.5 rounded-md">#{index + 1}</span>
                                          </div>
                                          <span className="text-[8px] text-white truncate text-right font-mono font-bold" title={img.name}>{Math.round(img.size / 1024)}KB</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Supporting Documents Checklists */}
                            <div className="space-y-1 bg-white p-3.5 rounded-xl border border-slate-200">
                              <span className="text-[11px] font-black text-indigo-950 block pb-1 border-b mb-2">تراخيص تشغيل المنشأة الميدانية (خاصة بالقاعة ومعزولة تماماً عن الوثائق القانونية الكلية للمزود)</span>
                              <div className="grid grid-cols-2 gap-3">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={venueWizData.commercialRegister}
                                    onChange={(e) => setVenueWizData({ ...venueWizData, commercialRegister: e.target.checked })}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                  />
                                  السجل التجاري للمنشأة ساري
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={venueWizData.municipalityLicense}
                                    onChange={(e) => setVenueWizData({ ...venueWizData, municipalityLicense: e.target.checked })}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                  />
                                  رخصة البلدية / أمانة المنطقة سارية
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={venueWizData.civilDefenseCert}
                                    onChange={(e) => setVenueWizData({ ...venueWizData, civilDefenseCert: e.target.checked })}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                  />
                                  تصريح الدفاع المدني لسلامة المنشأة
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={venueWizData.taxCert}
                                    onChange={(e) => setVenueWizData({ ...venueWizData, taxCert: e.target.checked })}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                  />
                                  شهادة التسجيل الضريبي المعتمدة
                                </label>
                              </div>
                            </div>

                            {/* Statuses (Admin Only vs. Provider State) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1 bg-amber-50 p-3 rounded-xl border border-amber-200">
                                <label className="text-[10px] font-black text-amber-900 block">الحالة الإدارية (للإدارة فقط وهي أعلى من حالة المزود)</label>
                                <div className="flex items-center gap-1.5 text-xs font-black text-amber-700 font-mono mt-1">
                                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                                  <span>{venueWizData.adminStatus}</span>
                                </div>
                                <p className="text-[9px] text-amber-700 mt-1 leading-relaxed">
                                  * خاضعة للحوكمة المسبقة ولا تظهر عامة للعملاء إلا بعد اعتماد الإدارة المباشر (قاعدة 6).
                                </p>
                              </div>
                              <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200">
                                <label className="text-[10px] font-black text-slate-500 block">الحالة التشغيلية للقاعة (للمزود)</label>
                                <select
                                  value={venueWizData.providerStatus}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, providerStatus: e.target.value })}
                                  className="w-full p-2 border border-slate-200 bg-white rounded-lg text-xs outline-none text-right font-black text-slate-700 mt-1"
                                >
                                  <option value="نشط ومتاح للعملاء">نشط ومتاح لاستلام طلبات الحجز للعملاء</option>
                                  <option value="مغلق مؤقتاً">مغلق مؤقتاً / تحت الصيانة الدورية</option>
                                </select>
                              </div>
                            </div>

                            {/* Pledge Accuracy */}
                            <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                              <label className="flex items-start gap-2.5 cursor-pointer text-xs font-bold text-emerald-950">
                                <input
                                  type="checkbox"
                                  checked={venueWizData.pledgeAccuracy}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, pledgeAccuracy: e.target.checked })}
                                  className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-0.5"
                                />
                                <div>
                                  <span className="block font-black text-emerald-900">التعهد بصحة المعلومات وتحمل المسؤولية *</span>
                                  <span className="text-[10px] text-emerald-800 block mt-0.5 leading-relaxed font-sans font-medium">
                                    أقر بصفتي الممثل القانوني للمنشأة بأن جميع المعلومات والأسعار والتراخيص المدخلة صحيحة تماماً وتطابق أرض الواقع، وأتحمل كامل المسؤولية المدنية والنظامية في حال حدوث أي تعارض أو تضليل في البيانات للعملاء أو لإدارة منصة ليلة.
                                  </span>
                                </div>
                              </label>
                            </div>
                          </motion.div>
                        )}

                        {/* Step 6: Review & Confirm */}
                        {venueWizStep === 6 && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            <div className="bg-amber-50 text-amber-900 p-3.5 rounded-xl text-[10px] leading-relaxed border border-amber-200 font-sans font-bold">
                              <strong>⚠️ إشعار حوكمة منصة ليلة (قاعدة 6):</strong> بموجب قوانين المنصة وقواعد اعتماد القاعات من قبل الإدارة، ستنضاف القاعة بحالة <strong>"معلق بانتظار الاعتماد - Pending Approval"</strong>. لن تظهر في الواجهة العامة للعملاء أو تندرج في نتائج البحث حتى يراجعها وتعتمدها الإدارة رسمياً.
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 text-xs font-bold text-slate-700">
                              <div className="flex items-center gap-1 border-b pb-2">
                                <Sparkles className="w-4 h-4 text-indigo-600" />
                                <h5 className="text-slate-900 font-black text-xs">ملخص بطاقة المراجعة الفنية الشاملة للمنشأة الجديدة</h5>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5 text-right text-[11px]">
                                <div className="border-b border-slate-100 pb-1.5">• الاسم التجاري للقاعة: <span className="text-slate-900 font-black">{venueWizData.name || 'لم يحدد'}</span></div>
                                <div className="border-b border-slate-100 pb-1.5">• تصنيف المنشأة: <span className="text-slate-900 font-black">{venueWizData.type}</span></div>
                                <div className="border-b border-slate-100 pb-1.5">• اسم مزود الخدمة: <span className="text-slate-900 font-black">{venueWizData.providerName} <span className="text-[9px] text-purple-600">({venueWizData.showProviderToCustomers ? 'مرئي للعميل' : 'مخفي'})</span></span></div>
                                <div className="border-b border-slate-100 pb-1.5">• هاتف التواصل: <span className="text-slate-900 font-mono font-black">{venueWizData.contactPhone} {venueWizData.contactPhone2 && ` / ${venueWizData.contactPhone2}`}</span></div>
                                <div className="border-b border-slate-100 pb-1.5">• المنطقة والمدينة: <span className="text-slate-900 font-black">{venueWizData.region}، {venueWizData.city}</span></div>
                                <div className="border-b border-slate-100 pb-1.5">• العنوان الوطني: <span className="text-slate-900 font-black text-[10px]">{venueWizData.nationalAddress || 'لم يحدد'}</span></div>
                                <div className="border-b border-slate-100 pb-1.5">• سعة الاستيعاب: <span className="text-slate-900 font-mono font-black">{venueWizData.capacity} شخص</span></div>
                                <div className="border-b border-slate-100 pb-1.5">• مبلغ التأمين وفترة الاسترجاع: <span className="text-slate-900 font-black">{venueWizData.securityDeposit} ر.س / {venueWizData.refundPeriod} يوم</span></div>
                                <div className="border-b border-slate-100 pb-1.5">• تسعير الفترات (صباحي / مسائي / يوم كامل): <span className="text-slate-900 font-mono font-black">{venueWizData.morningPrice} / {venueWizData.eveningPrice} / {venueWizData.fullDayPrice} ر.س</span></div>
                                <div className="border-b border-slate-100 pb-1.5">• نمط التسعير وتوليف خدمات المنصة: <span className="text-indigo-700 font-black">{venueWizData.pricingPattern === 'Hybrid' ? 'الهجين وتفعيل الخدمات الخارجية' : venueWizData.pricingPattern === 'Comprehensive' ? 'الباقات الشاملة والمغلقة' : 'الخدمات المنفردة الاختيارية'}</span></div>
                                {venueWizData.pricingPattern === 'Comprehensive' && (
                                  <div className="col-span-1 md:col-span-2 border-b border-purple-100 pb-1.5 bg-purple-50/20 p-2 rounded-xl">
                                    <span className="text-purple-950 font-black">📦 باقات المستودع المرفقة ({venueWizData.closedPackages?.length || 0}):</span>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                      {venueWizData.closedPackages && venueWizData.closedPackages.length > 0 ? (
                                        venueWizData.closedPackages.map(pkg => (
                                          <span key={pkg.id} className="bg-purple-100 text-purple-800 text-[10px] font-black px-2 py-1 rounded-md border border-purple-200">
                                            {pkg.name} ({parseInt(pkg.price).toLocaleString()} ر.س)
                                          </span>
                                        ))
                                      ) : (
                                        <span className="text-red-500 font-medium">لا توجد باقات جاهزة مضافة!</span>
                                      )}
                                    </div>
                                  </div>
                                )}
                                <div className="col-span-1 md:col-span-2 border-b border-indigo-100 pb-1.5 bg-indigo-50/20 p-2 rounded-xl">
                                  <span className="text-indigo-950 font-black">🖼️ ألبوم صور القاعة المدشن ({venueWizData.albumImages?.length || 0} صور):</span>
                                  <div className="flex gap-2 mt-1.5 overflow-x-auto pb-1">
                                    {venueWizData.albumImages && venueWizData.albumImages.length > 0 ? (
                                      venueWizData.albumImages.map((img, idx) => (
                                        <div key={idx} className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                                          <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        </div>
                                      ))
                                    ) : (
                                      <span className="text-slate-400 font-medium text-[10px]">لا توجد صور مضافة، سيتم استخدام المعرض الافتراضي.</span>
                                    )}
                                  </div>
                                </div>
                                <div className="border-b border-slate-100 pb-1.5">• الرقم الضريبي: <span className="text-slate-900 font-mono font-black">{venueWizData.isTaxExempt ? 'معفى من الضرائب بموجب التصريح' : venueWizData.taxNumber}</span></div>
                                <div className="border-b border-slate-100 pb-1.5">• باقة الخدمات الإضافية: <span className="text-slate-900 font-black">{venueWizData.additionalServicesBundle || 'لا يوجد'}</span></div>
                              </div>
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 text-[10px] text-slate-600 leading-relaxed font-medium">
                                • <strong>مرافق وضمانات المكان:</strong> {venueWizData.facilitiesAmenities} <br/>
                                • <strong>قواعد وضوابط المكان:</strong> {venueWizData.venueRules} <br/>
                                • <strong>شروط العقد وتفاصيل الضمانات التعاقدية:</strong> {venueWizData.contractTerms} <br/>
                                • <strong>التراخيص والوثائق المرفقة:</strong> {
                                  [
                                    venueWizData.commercialRegister && 'السجل التجاري',
                                    venueWizData.municipalityLicense && 'رخصة البلدية',
                                    venueWizData.civilDefenseCert && 'تصريح الدفاع المدني',
                                    venueWizData.taxCert && 'شهادة التسجيل الضريبي'
                                  ].filter(Boolean).join('، ') || 'لا يوجد'
                                }
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                          <div>
                            {venueWizStep > 1 && (
                              <button
                                type="button"
                                onClick={() => setVenueWizStep(venueWizStep - 1)}
                                className="px-3.5 py-1.5 text-slate-600 bg-white hover:bg-slate-100 rounded-lg text-xs font-black cursor-pointer border border-slate-200"
                              >
                                السابق
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2 font-sans">
                            {venueWizStep < 6 ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (venueWizStep === 1) {
                                    if (!venueWizData.name) {
                                      showNotification('warning', 'يرجى إدخال الاسم التجاري للقاعة أولاً.');
                                      return;
                                    }
                                    if (!venueWizData.contactPhone) {
                                      showNotification('warning', 'يرجى إدخال جوال للتواصل الرئيسي أولاً.');
                                      return;
                                    }
                                  }
                                  if (venueWizStep === 2) {
                                    if (!venueWizData.region || !venueWizData.city) {
                                      showNotification('warning', 'حقول المنطقة والمدينة مطلوبة إجبارياً.');
                                      return;
                                    }
                                  }
                                  if (venueWizStep === 3) {
                                    if (!venueWizData.capacity) {
                                      showNotification('warning', 'يرجى تحديد سعة الاستيعاب القصوى للقاعة.');
                                      return;
                                    }
                                  }
                                  if (venueWizStep === 4) {
                                    if (!venueWizData.refundPeriod) {
                                      showNotification('warning', 'يرجى تحديد فترة استرجاع العميل باليوم.');
                                      return;
                                    }
                                    if (!venueWizData.securityDeposit) {
                                      showNotification('warning', 'يرجى تحديد مبلغ التأمين المسترد.');
                                      return;
                                    }
                                  }
                                  if (venueWizStep === 5) {
                                    if (!venueWizData.pledgeAccuracy) {
                                      showNotification('warning', 'يرجى الموافقة والتوقيع على صك التعهد بصحة المعلومات وتحمل المسؤولية للمتابعة.');
                                      return;
                                    }
                                  }
                                  setVenueWizStep(venueWizStep + 1);
                                }}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black cursor-pointer shadow-sm"
                              >
                                التالي
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  const newHallObj = {
                                    id: String(catalogHalls.length + 1),
                                    name: venueWizData.name,
                                    capacity: parseInt(venueWizData.capacity),
                                    description: `قاعة فاخرة من نوع ${venueWizData.type} في مدينة ${venueWizData.city}. تتبع للمزود ${venueWizData.providerName}. مهيئة بنمط تسعير وتوليف: ${venueWizData.pricingPattern}.`,
                                    status: 'معلق بانتظار الاعتماد', // Rule 6 pending state
                                    policies: `Fulfillment Policy: ${venueWizData.fulfillmentPolicy} | Cancellation: ${venueWizData.cancellationPolicy}`,
                                    photosCount: venueWizData.albumImages && venueWizData.albumImages.length > 0 ? venueWizData.albumImages.length : 3,
                                    closedPackages: venueWizData.pricingPattern === 'Comprehensive' ? venueWizData.closedPackages : [],
                                    additionalServices: venueWizData.additionalServices || [],
                                    albumImages: venueWizData.albumImages || []
                                  };

                                  setCatalogHalls([...catalogHalls, newHallObj]);
                                  setVenueWizStep(1); // Reset step
                                  setVenueWizData({
                                    name: '',
                                    providerName: 'ليالينا للضيافة والاحتفالات',
                                    showProviderToCustomers: true,
                                    type: 'قصر أفراح',
                                    contactPhone: '0551234567',
                                    contactPhone2: '0557654321',
                                    description: 'قاعة مناسبات كبرى مصممة بأحدث الديكورات العصرية ومجهزة بكافة المرافق الفاخرة لتلائم المناسبات الكبرى وحفلات الزواج.',
                                    region: 'منطقة الرياض',
                                    city: 'الرياض',
                                    nationalAddress: '1234 الملقا، الرياض، المملكة العربية السعودية',
                                    addressDetails: 'طريق الملك سلمان بن عبدالعزيز، بجانب المجمع التجاري الكبير، مخرج ٤',
                                    capacity: '400',
                                    tablesCount: '50',
                                    chairsCount: '400',
                                    features: {
                                      ac: true,
                                      stage: true,
                                      ledScreens: false,
                                      soundSystem: true,
                                      brideRoom: true,
                                      parking: true,
                                    },
                                    basePrice: '15000',
                                    securityDeposit: '3000',
                                    refundPeriod: '14',
                                    morningPrice: '10000',
                                    eveningPrice: '15000',
                                    fullDayPrice: '22000',
                                    weekendPricingEnabled: true,
                                    increaseType: 'percentage',
                                    morningIncrease: '10',
                                    eveningIncrease: '15',
                                    fullDayIncrease: '12',
                                    pricingPattern: 'Hybrid',
                                    isTaxExempt: false,
                                    taxNumber: '301234567800003',
                                    additionalServicesBundle: 'باقة الضيافة المتكاملة (شامل طاقم تقديم ومفتشات جوال وبخور ممتاز)',
                                    venueRules: 'يمنع التدخين نهائياً داخل أروقة القاعة، يمنع إدخال الأطفال دون سن السابعة بدون مرافق، يلتزم المستأجر بإنهاء الحفل في الموعد المتفق عليه.',
                                    contractTerms: 'يلتزم الطرف الأول بتوفير القاعة نظيفة وجاهزة بالمرافق المذكورة، يلتزم الطرف الثاني بسداد مبلغ التأمين وتوقيع العقد النهائي قبل ٣ أيام من الحفل.',
                                    facilitiesAmenities: 'صالة طعام منفصلة، مصعد خاص لكبار السن والعروس، أجنحة عائلية واسعة، مطبخ تحضيري مجهز بالكامل.',
                                    cancellationPolicy: 'strict',
                                    fulfillmentPolicy: 'Hybrid Allowed',
                                    images: [],
                                    closedPackages: [],
                                    additionalServices: [],
                                    albumImages: [],
                                    civilDefenseCert: true,
                                    municipalityLicense: true,
                                    commercialRegister: true,
                                    taxCert: true,
                                    adminStatus: 'معلق بانتظار الاعتماد',
                                    providerStatus: 'نشط ومتاح للعملاء',
                                    pledgeAccuracy: false,
                                  });

                                  showNotification('success', 'تم تقديم طلب إضافة القاعة بنجاح وبدء تشغيل محرك الاعتماد التلقائي! الحالة الحالية: (معلق بانتظار الاعتماد) بموجب شروط الجودة وقاعدة 6.');
                                }}
                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black cursor-pointer shadow-md"
                              >
                                تقديم طلب الإضافة المعلق للإدارة
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Venue Store Manager Modal with Post-Booking Deadline Settings */}
                      {selectedHallForStore && (
                        <VenueStoreManagerModal
                          isOpen={!!selectedHallForStore}
                          onClose={() => setSelectedHallForStore(null)}
                          hall={selectedHallForStore}
                          showNotification={showNotification}
                        />
                      )}
                    </div>
  );
};
