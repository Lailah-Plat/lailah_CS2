import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useTheme } from '../context/ThemeContext';
import { 
  Building2, 
  Package, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  MapPin, 
  Users, 
  DollarSign, 
  Check, 
  X, 
  Eye, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  FileText, 
  Tag, 
  Briefcase,
  LayoutGrid,
  List,
  Table,
  RotateCcw,
  ArrowUpDown,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  ShieldCheck,
  FileCheck,
  Info,
  Image as ImageIcon,
  AlignLeft,
  Coins,
  MessageCircle,
  LayoutDashboard,
  Camera,
  PauseCircle,
  PlayCircle,
  History,
  GitBranch,
  Layers,
  AlertCircle
} from 'lucide-react';
import { AuditLog } from '../types';
import { 
  getStoredHalls, 
  saveStoredHalls, 
  getServices, 
  saveServices, 
  Hall, 
  EventService 
} from '../data/mockData';
import GoogleMapsModal from '../components/common/GoogleMapsModal';
import { validateImageFile, validateVideoFile } from '../utils/uploadValidator';
import ProviderChatModal from '../components/ProviderChatModal';
import { MediaStandardsGuideModal, MediaStandardsGuideTrigger } from '../components/MediaStandardsGuideModal';

const SAUDI_REGIONS = [
  { name: 'الرياض', cities: ['الرياض', 'الخرج', 'الدرعية', 'الدوادمي'] },
  { name: 'مكة المكرمة', cities: ['مكة المكرمة', 'جدة', 'الطائف', 'رابغ'] },
  { name: 'المدينة المنورة', cities: ['المدينة المنورة', 'ينبع', 'العلا'] },
  { name: 'المنطقة الشرقية', cities: ['الدمام', 'الخبر', 'الأحساء', 'الجبيل'] },
  { name: 'القصيم', cities: ['بريدة', 'عنيزة', 'الرس'] },
  { name: 'عسير', cities: ['أبها', 'خميس مشيط', 'أحد رفيدة'] },
  { name: 'حائل', cities: ['حائل'] },
  { name: 'تبوك', cities: ['تبوك'] },
  { name: 'الجوف', cities: ['سكاكا', 'القريات'] },
  { name: 'جيزان', cities: ['جيزان', 'صبيا'] },
  { name: 'نجران', cities: ['نجران'] },
  { name: 'الباحة', cities: ['الباحة'] },
  { name: 'الحدود الشمالية', cities: ['عرعر'] }
];

const sortGroups = [
  {
    id: 'date',
    options: [
      { value: 'newest', label: 'التاريخ (الأحدث أولاً)' },
      { value: 'oldest', label: 'التاريخ (الأقدم أولاً)' },
    ]
  },
  {
    id: 'full_price',
    options: [
      { value: 'full_price_asc', label: 'السعر كامل(الأقل أولاً)' },
      { value: 'full_price_desc', label: 'السعر كامل(الأعلى أولاً)' },
    ]
  },
  {
    id: 'night_price',
    options: [
      { value: 'night_price_asc', label: 'السعر مسائي(الأقل أولاً)' },
      { value: 'night_price_desc', label: 'السعر مسائي(الأعلى أولاً)' },
    ]
  },
  {
    id: 'morning_price',
    options: [
      { value: 'morning_price_asc', label: 'السعر صباحي(الأقل أولاً)' },
      { value: 'morning_price_desc', label: 'السعر صباحي(الأعلى أولاً)' },
    ]
  },
  {
    id: 'alpha',
    options: [
      { value: 'alpha_asc', label: 'فرز أبجدي (أ - ي)' },
      { value: 'alpha_desc', label: 'فرز أبجدي (ي - أ)' },
    ]
  }
];

const SortIcon = ({ sortOrder }: { sortOrder: string }) => {
  const isDesc = sortOrder.endsWith('desc') || sortOrder === 'newest';
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="18" 
      height="18" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className="transition-transform duration-300 transform text-[#162556]"
    >
      {isDesc ? (
        <>
          <line x1="4" x2="20" y1="6" y2="6" />
          <line x1="4" x2="15" y1="12" y2="12" />
          <line x1="4" x2="10" y1="18" y2="18" />
        </>
      ) : (
        <>
          <line x1="4" x2="10" y1="6" y2="6" />
          <line x1="4" x2="15" y1="12" y2="12" />
          <line x1="4" x2="20" y1="18" y2="18" />
        </>
      )}
    </svg>
  );
};

interface MultiImageUploaderProps {
  images: string[];
  maxImages: number;
  uploadType: 'hall' | 'service';
  onChange: (newImages: string[]) => void;
  isDark: boolean;
}

const MultiImageUploader: React.FC<MultiImageUploaderProps> = ({
  images,
  maxImages,
  uploadType,
  onChange,
  isDark
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await uploadFiles(Array.from(files));
  };

  const uploadFiles = async (fileList: File[]) => {
    if (images.length + fileList.length > maxImages) {
      setError(`لا يمكن رفع أكثر من ${maxImages} صور إجمالاً.`);
      return;
    }
    setError('');
    setUploading(true);

    const uploadedUrls: string[] = [];
    for (const file of fileList) {
      // Validate image properties
      const validation = await validateImageFile(file);
      if (!validation.valid) {
        setError(validation.error || 'الملف المختار غير صالح حسب شروط جودة المنصة.');
        setUploading(false);
        return;
      }
      
      const formData = new FormData();
      formData.append('image', file);

      try {
        const response = await fetch(`/api/upload?type=${uploadType}`, {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
          throw new Error('فشل الرفع');
        }
        const data = await response.json();
        if (data.success && data.url) {
          uploadedUrls.push(data.url);
        }
      } catch (err) {
        console.error('Error uploading file:', err);
        setError('حدث خطأ أثناء رفع أحد الملفات في الخادم');
      }
    }

    if (uploadedUrls.length > 0) {
      onChange([...images, ...uploadedUrls]);
    }
    setUploading(false);
  };

  const removeImage = (indexToRemove: number) => {
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (uploading) return;
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await uploadFiles(Array.from(files));
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-3xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center relative ${
          uploading ? 'opacity-70 pointer-events-none' : ''
        } ${
          isDark
            ? 'border-slate-800 bg-slate-900/40 hover:border-amber-400/50'
            : 'border-slate-200 bg-slate-50/50 hover:border-amber-500/50'
        }`}
      >
        <input
          type="file"
          id={`file-upload-${uploadType}`}
          multiple
          accept="image/*"
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={handleFileChange}
          disabled={uploading}
        />
        
        <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-full mb-1.5">
          {uploading ? (
            <svg className="animate-spin h-5 w-5 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          )}
        </div>
        <p className={`text-[11px] font-bold leading-normal mb-0.5 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
          {uploading ? 'جاري رفع الصور ومزامنتها مع الخادم...' : 'اسحب الصور لرفعها تلقائياً للخادم أو انقر للاختيار'}
        </p>
        <p className="text-[9px] text-slate-400">
          الحد الأقصى {maxImages} صور (صيغ JPG, PNG, WEBP)
        </p>
      </div>

      {error && (
        <div className="p-2.5 rounded-xl text-xs bg-rose-500/10 border border-rose-500/20 text-rose-500 font-bold">
          {error}
        </div>
      )}

      {images.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[10px] font-bold">
            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>الصور المرفوعة ({images.length} / {maxImages})</span>
            <span className="text-amber-500 text-[9px]">الصورة الأولى ستكون واجهة العرض الرئيسية</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {images.map((url, idx) => (
              <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-250 dark:border-slate-800 shadow-sm bg-slate-150">
                <img
                  src={url}
                  alt={`Upload ${idx + 1}`}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=500&q=60';
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 p-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-colors"
                >
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {idx === 0 && (
                  <span className="absolute bottom-0 inset-x-0 bg-black/70 text-amber-400 text-[8px] text-center font-bold py-0.5">
                    الرئيسية
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface CoverVideoUploaderProps {
  videoUrl: string;
  onChange: (url: string) => void;
  isDark: boolean;
  maxSizeMB: number;
  serverUrl: string;
}

const CoverVideoUploader: React.FC<CoverVideoUploaderProps> = ({
  videoUrl,
  onChange,
  isDark,
  maxSizeMB,
  serverUrl
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    setError('');
    const validation = await validateVideoFile(file, maxSizeMB);
    if (!validation.valid) {
      setError(validation.error || 'الملف غير صالح طبقاً للسياسة الموحدة للفيديو.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('video', file);

    try {
      const targetUrl = serverUrl || `/api/upload?type=video`;
      const response = await fetch(targetUrl, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('فشل الرفع');
      }
      const data = await response.json();
      if (data.success && data.url) {
        onChange(data.url);
      } else {
        setError('لم يرجع خادم الفيديوهات رابطاً صالحاً.');
      }
    } catch (err) {
      console.error('Error uploading video:', err);
      setError('حدث خطأ في الإرسال لخادم الفيديو المخصص. جار رفع الفيديو محلياً كبديل مؤقت...');
      try {
        const localFormData = new FormData();
        localFormData.append('image', file);
        const localResponse = await fetch('/api/upload?type=video', {
          method: 'POST',
          body: localFormData
        });
        if (localResponse.ok) {
          const localData = await localResponse.json();
          if (localData.success && localData.url) {
            onChange(localData.url);
            setError('');
          }
        }
      } catch (localErr) {
        setError('فشل في رفع الفيديو على الخادم المحلي أيضاً.');
      }
    } finally {
      setUploading(false);
    }
  };

  const removeVideo = () => {
    onChange('');
    setError('');
  };

  return (
    <div className="space-y-1.5 flex-1 text-right">
      <label className={`text-xs font-black block ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>رفع فيديو غلاف تفاعلي (اختياري) 🎥</label>
      <div 
        className={`relative h-28 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all ${
          videoUrl 
            ? 'border-indigo-500 bg-indigo-500/5 shadow-xs' 
            : isDark 
              ? 'border-slate-800 hover:border-amber-400 bg-slate-950/40' 
              : 'border-slate-200 hover:border-amber-500 bg-slate-50'
        }`}
      >
        {videoUrl ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
            <video 
              src={videoUrl} 
              className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none" 
              autoPlay 
              loop 
              muted 
              playsInline
            />
            <div className="relative z-10 bg-slate-900/80 text-white px-3 py-1 rounded-lg text-[10px] font-black flex items-center gap-1.5">
              <span>فيديو الغلاف نشط ✨</span>
              <button 
                type="button" 
                onClick={removeVideo}
                className="bg-rose-600 hover:bg-rose-700 p-1 rounded-md text-white transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center p-4">
            <input 
              type="file" 
              accept="video/mp4" 
              onChange={handleFileChange}
              className="hidden" 
              disabled={uploading}
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[10px] text-slate-500 font-bold">جاري معالجة ورفع الفيديو...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Plus className={`w-6 h-6 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <span className="text-[10px] font-extrabold text-slate-500">اختر أو اسحب ملف فيديو MP4 هنا</span>
                <span className="text-[8px] text-slate-400">الحد الأقصى {maxSizeMB}MB (1280x720)</span>
              </div>
            )}
          </label>
        )}
      </div>
      {error && <p className="text-[10px] text-rose-500 text-right leading-relaxed mt-1 font-semibold">{error}</p>}
    </div>
  );
};

interface SingleDocUploaderProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  isDark: boolean;
  uploadType: string;
}

const SingleDocUploader: React.FC<SingleDocUploaderProps> = ({
  label,
  value,
  onChange,
  isDark,
  uploadType
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    
    setError('');
    
    // Validate image quality & properties
    const validation = await validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'الملف غير صالح طبقاً للسياسة الموحدة.');
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`/api/upload?type=${uploadType}`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('فشل الرفع');
      }
      const data = await response.json();
      if (data.success && data.url) {
        onChange(data.url);
      } else {
        setError('فشل رفع الملف من الخادم');
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('حدث خطأ أثناء رفع ملف الثبوتيات');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5 flex-1">
      <label className={`text-xs font-black block ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{label}</label>
      <div 
        className={`relative h-28 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all ${
          value 
            ? 'border-emerald-500 bg-emerald-500/5 shadow-xs' 
            : isDark 
              ? 'border-slate-800 hover:border-amber-400 bg-slate-950/40' 
              : 'border-slate-200 hover:border-amber-500 bg-slate-50'
        }`}
      >
        {value ? (
          <div className="absolute inset-0 w-full h-full group">
            <img src={value} alt={label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
              <span className="text-[10px] text-white font-black truncate max-w-[80%]">{label}</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-black rounded-lg transition-colors cursor-pointer"
                >
                  حذف
                </button>
                <label className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-900 text-[9px] font-black rounded-lg transition-colors cursor-pointer">
                  تغيير
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              </div>
            </div>
          </div>
        ) : (
          <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-3">
            {uploading ? (
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-[9px] text-slate-500 font-bold">جاري الرفع...</span>
              </div>
            ) : (
              <>
                <svg className={`w-5 h-5 mb-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span className="text-[9px] text-slate-500 font-bold text-center">انقر لرفع المستند</span>
                <span className="text-[7px] text-slate-400 mt-0.5">صورة ثبوتية واضحة</span>
              </>
            )}
            <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={handleFileChange} />
          </label>
        )}
      </div>
      {error && <p className="text-[8px] text-rose-500 font-bold mt-1 text-center">{error}</p>}
    </div>
  );
};

export default function HallsServicesPortalPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  useEffect(() => {
    // Graceful forwarding to Unified Provider Dashboard
    navigate('/provider-dashboard?tab=halls', { replace: true });
  }, [navigate]);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [currentProviderName, setCurrentProviderName] = useState<string>('');
  
  // Tab switching: 'halls' | 'services'
  const [activeTab, setActiveTab] = useState<'halls' | 'services'>('halls');

  // Real-time Provider Chat Modal trigger
  const [isProviderChatOpen, setIsProviderChatOpen] = useState(false);
  const [chatData, setChatData] = useState({ providerName: '', hallName: '' });

  // Media Standards & Interactive Guide Modal State
  const [isMediaGuideOpen, setIsMediaGuideOpen] = useState(false);
  const [mediaGuideTab, setMediaGuideTab] = useState<'guide' | 'inspector' | 'camera_setup'>('guide');

  const openProviderChat = (e: React.MouseEvent, providerName: string, hallName: string) => {
    e.preventDefault();
    e.stopPropagation();
    setChatData({ providerName: providerName || 'مزود خدمة معتمد', hallName });
    setIsProviderChatOpen(true);
  };
  
  // Data lists
  const [halls, setHalls] = useState<Hall[]>([]);
  const [services, setServices] = useState<EventService[]>([]);
  
  // Dynamic categories from central platform settings
  const [hallCategories, setHallCategories] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('SYSTEM_DATastore_hallCategories');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return ['قاعة أفراح', 'استراحة قسم', 'استراحة قسمين', 'شاليه', 'منتجع', 'متنزه', 'مخيم', 'قاعة اجتماع', 'أخرى'];
  });

  const [serviceCategories, setServiceCategories] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('SYSTEM_DATastore_serviceCategories');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return ['ضيافة', 'تصوير', 'دي جي', 'بوفيه مفتوح', 'تنسيق ورد', 'عشاء وحفلات', 'تنظيم حشود'];
  });
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('table');
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Reset Filters Function
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedRegion('');
    setSelectedCity('');
    setSelectedCategory('');
    setSelectedProvider('');
    setSelectedStatus('');
    setSortOrder('newest');
    setCurrentPage(1);
  };

  // Modals state
  const [isHallModalOpen, setIsHallModalOpen] = useState(false);
  const [editingHall, setEditingHall] = useState<Hall | null>(null);
  const [hallModalStep, setHallModalStep] = useState(1);
  const [formError, setFormError] = useState('');
  const [isMapsOpen, setIsMapsOpen] = useState(false);
  const [isCustomCity, setIsCustomCity] = useState(false);
  const [customCityName, setCustomCityName] = useState('');
  
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<EventService | null>(null);
  const [serviceModalStep, setServiceModalStep] = useState(1);
  const [serviceFormError, setServiceFormError] = useState('');

  const [isHallImageUploading, setIsHallImageUploading] = useState(false);
  const [isServiceImageUploading, setIsServiceImageUploading] = useState(false);

  // Catalog Versioning, Pause/Resume & Audit Log States
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [selectedAuditEntity, setSelectedAuditEntity] = useState<{ type: 'hall' | 'service'; id: number | string; name: string } | null>(null);
  const [auditLogsList, setAuditLogsList] = useState<AuditLog[]>(() => {
    try {
      const stored = localStorage.getItem('layla_audit_logs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isImpactModalOpen, setIsImpactModalOpen] = useState(false);
  const [impactModalData, setImpactModalData] = useState<{
    entityName: string;
    entityType: 'hall' | 'service';
    version: number;
    previousPrice?: number;
    newPrice?: number;
    activeBookingsCount: number;
    isPreSave?: boolean;
  } | null>(null);

  const recordAuditLog = (entry: Omit<AuditLog, 'id' | 'timestamp'>) => {
    try {
      const raw = localStorage.getItem('layla_audit_logs');
      const logs: AuditLog[] = raw ? JSON.parse(raw) : [];
      const newEntry: AuditLog = {
        ...entry,
        id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        timestamp: new Date().toISOString()
      };
      logs.unshift(newEntry);
      localStorage.setItem('layla_audit_logs', JSON.stringify(logs));
      setAuditLogsList(logs);
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Error saving audit log:', e);
    }
  };

  // Custom Package Builder Modal States
  const [isPkgModalOpen, setIsPkgModalOpen] = useState(false);
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);
  const [pkgName, setPkgName] = useState('باقة الفخامة المتكاملة');
  const [pkgPrice, setPkgPrice] = useState('15000');
  const [pkgDesc, setPkgDesc] = useState('');
  const [pkgMorningPrice, setPkgMorningPrice] = useState('');
  const [pkgNightPrice, setPkgNightPrice] = useState('');
  const [pkgFullDayPrice, setPkgFullDayPrice] = useState('');
  const [pkgIsPopular, setPkgIsPopular] = useState(false);

  // Form states - Halls
  const [hallForm, setHallForm] = useState({
    name: '',
    category: 'قاعة أفراح',
    provider: '',
    showProvider: true,
    providerType: 'منشأة' as 'منشأة' | 'فرد',
    crNumber: '',
    crExpiryDate: '',
    phone: '',
    email: '',
    taxNumber: '',
    isVatExempt: true,
    crImage: '',
    vatImage: '',
    ibanImage: '',
    region: 'الرياض',
    city: 'الرياض',
    address: '',
    nationalAddress: '',
    capacity: 200 as number | string,
    nightPrice: 10000,
    morningPrice: 5000,
    fullDayPrice: 13000,
    weekendPrice: 12000,
    weekendMorningPrice: 6000,
    weekendNightPrice: 12000,
    weekendFullDayPrice: 15000,
    securityDeposit: 1000,
    facilities: '',
    rules: '',
    status: 'مفعل',
    bookingStatus: 'متاح' as 'متاح' | 'محجوز',
    contractTerms: '',
    rating: 4.8,
    reviewsCount: 12,
    cancellationPeriod: 7 as number | string,
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80',
    images: [] as string[],
    paymentMethods: ['mada', 'bank_transfer'] as string[],
    extraServicesList: [] as any[],
    pledge: false,
    about: '',
    extraAddress: '',
    bookingType: 'alacarte' as 'packages' | 'alacarte' | 'venueonly',
    packagesList: [] as any[],
    videoUrl: ''
  });

  // Form states - Services
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    provider: '',
    price: 150,
    regions: 'الرياض',
    cities: 'الرياض',
    terms: '',
    serviceStatus: 'نشط',
    adminStatus: 'فعالة',
    category: 'بوفيه وضيافة',
    city: 'الرياض',
    rating: 4.5,
    quantityLimit: '10',
    image: 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=500&q=60',
    images: [] as string[],
    videoUrl: ''
  });

  // Video configuration state
  const [videoConfig, setVideoConfig] = useState({
    videosEnabled: false,
    videoServerUrl: '',
    maxVideoSizeMB: 10
  });

  // Security guard check
  useEffect(() => {
    const isAuth = localStorage.getItem('IS_AUTHENTICATED') === 'true';
    if (!isAuth) {
      navigate('/', { replace: true });
      return;
    }
    
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (!storedUser) {
        navigate('/', { replace: true });
        return;
      }
      
      const parsedUser = JSON.parse(storedUser);
      const roleStr = (parsedUser.role || '').toLowerCase();
      const isAdminOrProvider = 
        roleStr.includes('admin') || 
        roleStr.includes('مدير') || 
        roleStr.includes('مشرف') || 
        roleStr.includes('provider') || 
        roleStr.includes('مزود') || 
        roleStr.includes('موظف');
      
      if (!isAdminOrProvider) {
        navigate('/', { replace: true });
        return;
      }

      setIsAuthenticated(true);
      setCurrentUser(parsedUser);
      setUserRole(roleStr.includes('admin') || roleStr.includes('مدير') || roleStr.includes('مشرف') ? 'admin' : 'provider');
      setCurrentProviderName(parsedUser.name || 'سالم الدوسري');

      // Load data
      setHalls(getStoredHalls());
      setServices(getServices());

      // Fetch Video config from security endpoint
      fetch('/api/security/config')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.config) {
            setVideoConfig({
              videosEnabled: data.config.videosEnabled === true || data.config.videosEnabled === 'true',
              videoServerUrl: data.config.videoServerUrl || '',
              maxVideoSizeMB: Number(data.config.maxVideoSizeMB) || 10
            });
          }
        })
        .catch(err => console.warn("Could not fetch video config:", err));
    } catch {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  // Sync data updates across tabs/windows
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const syncData = () => {
      setHalls(getStoredHalls());
      setServices(getServices());
      try {
        const storedHalls = localStorage.getItem('SYSTEM_DATastore_hallCategories');
        if (storedHalls) setHallCategories(JSON.parse(storedHalls));
      } catch (e) {}
      try {
        const storedServices = localStorage.getItem('SYSTEM_DATastore_serviceCategories');
        if (storedServices) setServiceCategories(JSON.parse(storedServices));
      } catch (e) {}
    };
    window.addEventListener('storage', syncData);
    window.addEventListener('settingsUpdated', syncData);
    window.addEventListener('hallsUpdated', syncData);
    window.addEventListener('servicesUpdated', syncData);
    return () => {
      window.removeEventListener('storage', syncData);
      window.removeEventListener('settingsUpdated', syncData);
      window.removeEventListener('hallsUpdated', syncData);
      window.removeEventListener('servicesUpdated', syncData);
    };
  }, [isAuthenticated]);

  // Click-outside handler for sort dropdown
  useEffect(() => {
    if (!isSortDropdownOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#sort-dropdown-container')) {
        setIsSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isSortDropdownOpen]);

  // Get available cities depending on selected region in forms or filter
  const filterCities = useMemo(() => {
    if (!selectedRegion) return [];
    const reg = SAUDI_REGIONS.find(r => r.name === selectedRegion);
    return reg ? reg.cities : [];
  }, [selectedRegion]);

  const formCities = useMemo(() => {
    const reg = SAUDI_REGIONS.find(r => r.name === hallForm.region);
    return reg ? reg.cities : [];
  }, [hallForm.region]);

  // Check if provider has dynamic pricing or weekend pricing
  const hasDynamicPricing = useMemo(() => {
    if (userRole === 'admin') return true;
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const u = JSON.parse(storedUser);
        const name = u.name || '';
        const key = name ? `provider_subscription_${name}` : 'provider_subscription';
        const storedSub = localStorage.getItem(key);
        if (storedSub) {
          const sub = JSON.parse(storedSub);
          return !!sub?.includesWeekendPricing || !!sub?.includesDynamicSurgePricing || !!sub?.includesDynamicPricing || !!sub?.addons?.includes('weekend_pricing') || !!sub?.addons?.includes('dynamic_surge_pricing') || !!sub?.addons?.includes('dynamic_pricing') || sub?.id === 'pro' || sub?.id === 'business';
        }
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  }, [userRole, currentProviderName]);

  const administrativePaymentMethods = useMemo(() => {
    try {
      const stored = localStorage.getItem('PAYMENT_SETTINGS');
      const allGateways = [
        { key: 'mada', name: 'مدى (Mada)' },
        { key: 'creditMax', name: 'بطاقة ائتمان (Visa/Master)' },
        { key: 'apple', name: 'أبل باي (Apple Pay)' },
        { key: 'stc', name: 'إس تي سي باي (STC Pay)' },
        { key: 'google_pay', name: 'قوقل باي (Google Pay)' },
        { key: 'tabby', name: 'تابي (Tabby)' },
        { key: 'tamara', name: 'تمارا (Tamara)' },
        { key: 'bank_transfer', name: 'تحويل بنكي' }
      ];
      if (stored) {
        const settings = JSON.parse(stored);
        return allGateways.filter(g => settings[g.key] === true);
      }
      // If none stored, return default ones from App.tsx
      return allGateways.filter(g => ['mada', 'creditMax', 'apple', 'stc', 'tabby', 'tamara', 'bank_transfer'].includes(g.key));
    } catch (e) {
      return [
        { key: 'mada', name: 'مدى (Mada)' },
        { key: 'creditMax', name: 'بطاقة ائتمان (Visa/Master)' },
        { key: 'apple', name: 'أبل باي (Apple Pay)' },
        { key: 'bank_transfer', name: 'تحويل بنكي' }
      ];
    }
  }, []);

  const serviceCities = useMemo(() => {
    const reg = SAUDI_REGIONS.find(r => r.name === serviceForm.regions);
    return reg ? reg.cities : [];
  }, [serviceForm.regions]);

  // Unique providers list for admin dropdown
  const uniqueProviders = useMemo(() => {
    const list = activeTab === 'halls' ? halls : services;
    const providersSet = new Set(list.map(item => item.provider).filter(Boolean));
    return Array.from(providersSet) as string[];
  }, [halls, services, activeTab]);

  // Filtered lists shown in the UI
  const displayedHalls = useMemo(() => {
    let result = halls.filter(h => {
      // If provider, only see own halls
      if (userRole === 'provider' && h.provider !== currentProviderName) {
        return false;
      }

      // Provider filter (for admins only)
      if (userRole === 'admin' && selectedProvider && h.provider !== selectedProvider) {
        return false;
      }
      
      const matchesSearch = !searchQuery || 
        (h.name || '').includes(searchQuery) || 
        (h.provider || '').includes(searchQuery) || 
        (h.city || '').includes(searchQuery);
        
      const matchesRegion = !selectedRegion || h.region === selectedRegion;
      const matchesCity = !selectedCity || h.city === selectedCity;

      // Category filter (قاعة أفراح، استراحة قسم واحد، استراحة قسمين، شاليه، منتجع، مخيم، إلخ)
      const matchesCategory = !selectedCategory || h.category === selectedCategory;

      // Status filter (مفعلة، موقوفة، بانتظار الموافقة والاعتماد الإداري)
      let matchesStatus = true;
      if (selectedStatus) {
        const hStatus = (h.status || '').toLowerCase();
        if (selectedStatus === 'مفعل') {
          matchesStatus = hStatus === 'مفعل' || hStatus === 'نشط' || hStatus === 'فعال';
        } else if (selectedStatus === 'معطل') {
          matchesStatus = hStatus === 'معطل' || hStatus === 'موقوف' || hStatus === 'موقوفة' || hStatus === 'معطلة';
        } else if (selectedStatus === 'بانتظار الاعتماد') {
          matchesStatus = hStatus.includes('بانتظار') || hStatus.includes('تحت') || hStatus === 'pending' || !hStatus;
        }
      }

      return matchesSearch && matchesRegion && matchesCity && matchesCategory && matchesStatus;
    });

    // Sorting Engine: 10 options
    if (sortOrder === 'newest') {
      result.sort((a, b) => Number(b.id) - Number(a.id));
    } else if (sortOrder === 'oldest') {
      result.sort((a, b) => Number(a.id) - Number(b.id));
    } else if (sortOrder === 'full_price_asc') {
      result.sort((a, b) => {
        const pA = Number(a.fullDayPrice || a.nightPrice || a.morningPrice || a.price || 0);
        const pB = Number(b.fullDayPrice || b.nightPrice || b.morningPrice || b.price || 0);
        return pA - pB;
      });
    } else if (sortOrder === 'full_price_desc') {
      result.sort((a, b) => {
        const pA = Number(a.fullDayPrice || a.nightPrice || a.morningPrice || a.price || 0);
        const pB = Number(b.fullDayPrice || b.nightPrice || b.morningPrice || b.price || 0);
        return pB - pA;
      });
    } else if (sortOrder === 'night_price_asc') {
      result.sort((a, b) => {
        const pA = Number(a.nightPrice || a.fullDayPrice || a.morningPrice || a.price || 0);
        const pB = Number(b.nightPrice || b.fullDayPrice || b.morningPrice || b.price || 0);
        return pA - pB;
      });
    } else if (sortOrder === 'night_price_desc') {
      result.sort((a, b) => {
        const pA = Number(a.nightPrice || a.fullDayPrice || a.morningPrice || a.price || 0);
        const pB = Number(b.nightPrice || b.fullDayPrice || b.morningPrice || b.price || 0);
        return pB - pA;
      });
    } else if (sortOrder === 'morning_price_asc') {
      result.sort((a, b) => {
        const pA = Number(a.morningPrice || a.nightPrice || a.fullDayPrice || a.price || 0);
        const pB = Number(b.morningPrice || b.nightPrice || b.fullDayPrice || b.price || 0);
        return pA - pB;
      });
    } else if (sortOrder === 'morning_price_desc') {
      result.sort((a, b) => {
        const pA = Number(a.morningPrice || a.nightPrice || a.fullDayPrice || a.price || 0);
        const pB = Number(b.morningPrice || b.nightPrice || b.fullDayPrice || b.price || 0);
        return pB - pA;
      });
    } else if (sortOrder === 'alpha_asc') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'));
    } else if (sortOrder === 'alpha_desc') {
      result.sort((a, b) => (b.name || '').localeCompare(a.name || '', 'ar'));
    }

    return result;
  }, [halls, userRole, currentProviderName, searchQuery, selectedRegion, selectedCity, selectedCategory, selectedProvider, selectedStatus, sortOrder]);

  const displayedServices = useMemo(() => {
    let result = services.filter(s => {
      // If provider, only see own services
      if (userRole === 'provider' && s.provider !== currentProviderName) {
        return false;
      }

      // Provider filter (for admins only)
      if (userRole === 'admin' && selectedProvider && s.provider !== selectedProvider) {
        return false;
      }

      // Regular customer/client filtering rules
      if (userRole !== 'admin' && userRole !== 'provider') {
        const isAdminActive = s.adminStatus === 'فعالة' || s.adminStatus === 'مفعلة' || !s.adminStatus;
        if (!isAdminActive) return false;
        if (s.serviceStatus === 'معطلة') return false;
      }
      
      const matchesSearch = !searchQuery || 
        (s.name || '').includes(searchQuery) || 
        (s.provider || '').includes(searchQuery) || 
        (s.description || '').includes(searchQuery);

      const matchesRegion = !selectedRegion || (s.regions || '').includes(selectedRegion);
      const matchesCity = !selectedCity || (s.cities || '').includes(selectedCity);

      // Category filter (بوفيه وضيافة، تصوير، دي جي وفِرق، تنسيق قاعات، إلخ)
      const matchesCategory = !selectedCategory || s.category === selectedCategory;

      // Status filter
      let matchesStatus = true;
      if (selectedStatus) {
        const sStatus = (s.serviceStatus || '').toLowerCase();
        const aStatus = (s.adminStatus || '').toLowerCase();
        if (selectedStatus === 'مفعل') {
          matchesStatus = sStatus === 'نشط' || sStatus === 'مفعل' || sStatus === 'فعال' || aStatus === 'فعالة' || aStatus === 'موثوقة';
        } else if (selectedStatus === 'معطل') {
          matchesStatus = sStatus === 'معطل' || sStatus === 'موقوف' || aStatus === 'محظورة';
        } else if (selectedStatus === 'بانتظار الاعتماد') {
          matchesStatus = sStatus.includes('بانتظار') || aStatus.includes('بانتظار') || sStatus === 'pending' || aStatus === 'pending';
        }
      }

      return matchesSearch && matchesRegion && matchesCity && matchesCategory && matchesStatus;
    });

    // Sorting Engine: extended values
    if (sortOrder === 'newest') {
      result.sort((a, b) => Number(b.id) - Number(a.id));
    } else if (sortOrder === 'oldest') {
      result.sort((a, b) => Number(a.id) - Number(b.id));
    } else if (sortOrder === 'full_price_asc' || sortOrder === 'night_price_asc' || sortOrder === 'morning_price_asc') {
      result.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sortOrder === 'full_price_desc' || sortOrder === 'night_price_desc' || sortOrder === 'morning_price_desc') {
      result.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else if (sortOrder === 'alpha_asc') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'));
    } else if (sortOrder === 'alpha_desc') {
      result.sort((a, b) => (b.name || '').localeCompare(a.name || '', 'ar'));
    }

    return result;
  }, [services, userRole, currentProviderName, searchQuery, selectedRegion, selectedCity, selectedCategory, selectedProvider, selectedStatus, sortOrder]);

  // Paginated Slices for the tabular/list/grid view
  const paginatedHalls = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return displayedHalls.slice(startIndex, startIndex + rowsPerPage);
  }, [displayedHalls, currentPage, rowsPerPage]);

  const paginatedServices = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return displayedServices.slice(startIndex, startIndex + rowsPerPage);
  }, [displayedServices, currentPage, rowsPerPage]);

  const totalHallsPages = Math.ceil(displayedHalls.length / rowsPerPage) || 1;
  const totalServicesPages = Math.ceil(displayedServices.length / rowsPerPage) || 1;

  // Edit actions
  const handleOpenEditHall = (hall: Hall) => {
    setEditingHall(hall);
    setIsCustomCity(!SAUDI_REGIONS.some(r => r.cities.includes(hall.city || '')));
    setCustomCityName(!SAUDI_REGIONS.some(r => r.cities.includes(hall.city || '')) ? (hall.city || '') : '');
    setHallForm({
      name: hall.name || '',
      category: hall.category || 'قاعة أفراح',
      provider: hall.provider || currentProviderName,
      showProvider: hall.showProvider !== false,
      providerType: (hall.providerType as 'منشأة' | 'فرد') || 'منشأة',
      crNumber: hall.crNumber || '',
      crExpiryDate: hall.crExpiryDate || '',
      phone: hall.phone || (currentUser?.phone || '0543210987'),
      email: hall.email || (currentUser?.email || 'provider@lylah.com'),
      taxNumber: hall.taxNumber || '',
      isVatExempt: !hall.taxNumber,
      crImage: hall.crFile || '',
      vatImage: hall.vatFile || '',
      ibanImage: hall.ibanFile || '',
      region: hall.region || 'الرياض',
      city: hall.city || 'الرياض',
      address: hall.address || '',
      nationalAddress: hall.nationalAddress || '',
      capacity: hall.capacity || 200,
      nightPrice: hall.nightPrice || 10000,
      morningPrice: hall.morningPrice || 5000,
      fullDayPrice: hall.fullDayPrice || 13000,
      weekendPrice: hall.weekendPrice || 12000,
      weekendMorningPrice: hall.weekendMorningPrice || 6000,
      weekendNightPrice: hall.weekendNightPrice || 12000,
      weekendFullDayPrice: hall.weekendFullDayPrice || 15000,
      securityDeposit: hall.securityDeposit || 1000,
      facilities: hall.facilities || '',
      rules: typeof hall.rules === 'string' ? hall.rules : (Array.isArray(hall.rules) ? hall.rules.join('، ') : ''),
      status: (hall.status === 'مفعل' || hall.status === 'نشط') ? 'مفعل' : 'معطل',
      bookingStatus: (hall.bookingStatus || 'متاح') as 'متاح' | 'محجوز',
      contractTerms: hall.contractTerms || '',
      rating: hall.rating || 4.8,
      reviewsCount: hall.reviewsCount || 12,
      cancellationPeriod: hall.cancellationPeriod || 7,
      image: hall.image || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80',
      images: Array.isArray(hall.images) ? hall.images : (hall.image ? [hall.image] : []),
      paymentMethods: hall.paymentMethods || ['mada', 'bank_transfer'],
      extraServicesList: hall.extraServicesList || [],
      pledge: hall.pledge || false,
      about: hall.description || '',
      extraAddress: hall.extraAddress || '',
      bookingType: hall.bookingType || 'alacarte',
      packagesList: hall.packagesList || [],
      videoUrl: (hall as any).videoUrl || ''
    });
    setHallModalStep(1);
    setFormError('');
    setIsHallModalOpen(true);
  };

  const handleOpenAddHall = () => {
    setEditingHall(null);
    setIsCustomCity(false);
    setCustomCityName('');
    setHallForm({
      name: '',
      category: 'قاعة أفراح',
      provider: currentProviderName,
      showProvider: true,
      providerType: 'منشأة',
      videoUrl: '',
      crNumber: '',
      crExpiryDate: '',
      phone: currentUser?.phone || '0543210987',
      email: currentUser?.email || 'provider@lylah.com',
      taxNumber: '',
      isVatExempt: true,
      crImage: '',
      vatImage: '',
      ibanImage: '',
      region: 'الرياض',
      city: 'الرياض',
      address: '',
      nationalAddress: '',
      capacity: 200,
      nightPrice: 10000,
      morningPrice: 5000,
      fullDayPrice: 13000,
      weekendPrice: 12000,
      weekendMorningPrice: 6000,
      weekendNightPrice: 12000,
      weekendFullDayPrice: 15000,
      securityDeposit: 1000,
      facilities: '',
      rules: '',
      status: 'مفعل',
      bookingStatus: 'متاح',
      contractTerms: '',
      rating: 4.8,
      reviewsCount: 0,
      cancellationPeriod: 7,
      image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80',
      images: [],
      paymentMethods: ['mada', 'bank_transfer'],
      extraServicesList: [],
      pledge: false,
      about: '',
      extraAddress: '',
      bookingType: 'alacarte',
      packagesList: []
    });
    setHallModalStep(1);
    setFormError('');
    setIsHallModalOpen(true);
  };

  const addAdminNotification = (title: string, desc: string, type: string = 'warning') => {
    try {
      const stored = localStorage.getItem('PLATFORM_NOTIFICATIONS_SECURE');
      let notifs = stored ? JSON.parse(stored) : [];
      const newNotif = {
        id: Date.now(),
        title,
        description: desc,
        time: new Date().toISOString(),
        unread: true,
        type
      };
      notifs.unshift(newNotif);
      localStorage.setItem('PLATFORM_NOTIFICATIONS_SECURE', JSON.stringify(notifs));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Error adding admin notification:', e);
    }
  };

  const canGoToNextStep = () => {
    if (hallModalStep === 1) {
      if (!hallForm.name.trim()) {
        setFormError('يرجى تحديد اسم المنشأة أو القاعة للاستمرار');
        return false;
      }
      const phoneStr = String(hallForm.phone).trim();
      if (!phoneStr) {
        setFormError('يرجى إدخال رقم الجوال للتواصل');
        return false;
      }
      if (!/^05\d{8}$/.test(phoneStr)) {
        setFormError('رقم الجوال يجب أن يكون 10 أرقام ويبدأ بـ 05 (مثل 0512345678)');
        return false;
      }
      const emailStr = String(hallForm.email).trim();
      if (!emailStr) {
        setFormError('يرجى إدخال البريد الإلكتروني لمزود الخدمة');
        return false;
      }
      if (!/^\S+@\S+\.\S+$/.test(emailStr)) {
        setFormError('يرجى إدخال بريد إلكتروني صحيح للتحقق من صحته');
        return false;
      }
    }
    if (hallModalStep === 2) {
      if (isCustomCity && !customCityName.trim()) {
        setFormError('يرجى كتابة اسم المدينة غير الموجودة لإعلام الإدارة بها');
        return false;
      }
      if (!hallForm.address.trim()) {
        setFormError('يرجى إدخال العنوان الوطني الكلي للمنشأة أو تحديده من خريطة قوقل');
        return false;
      }
    }
    if (hallModalStep === 3) {
      if (!hallForm.capacity || Number(hallForm.capacity) <= 0) {
        setFormError('يرجى تحديد السعة الاستيعابية للمنشأة من أشخاص');
        return false;
      }
      if (hallForm.providerType === 'منشأة') {
        const cr = hallForm.crNumber.trim();
        if (!cr) {
          setFormError('الرجاء توفير رقم السجل التجاري لتوثيق المنشأة إدارياً');
          return false;
        }
        if (cr.length !== 10) {
          setFormError('رقم السجل التجاري يجب أن يتكون من 10 أرقام تماماً دون زيادة أو نقصان');
          return false;
        }
      }
      if (hallForm.providerType === 'فرد') {
        const idNum = hallForm.crNumber.trim();
        if (!idNum) {
          setFormError('الرجاء توفير رقم الهوية الوطنية للتوثيق');
          return false;
        }
        if (idNum.length !== 10) {
          setFormError('رقم الهوية الوطنية يجب أن يتكون من 10 أرقام تماماً دون زيادة أو نقصان');
          return false;
        }
        if (!idNum.startsWith('1') && !idNum.startsWith('2')) {
          setFormError('رقم الهوية الوطنية يجب أن يبدأ بالرقم 1 أو 2 حصراً');
          return false;
        }
      }
      if (!hallForm.crExpiryDate) {
        setFormError('يرجى تحديد تاريخ انتهاء السجل التجاري أو الهوية الوطنية');
        return false;
      }
      if (!hallForm.isVatExempt && !hallForm.taxNumber.trim()) {
        setFormError('يرجى إدخال الرقم الضريبي الخاص بمؤسستك');
        return false;
      }
      if (!hallForm.nightPrice || Number(hallForm.nightPrice) <= 0) {
        setFormError('يرجى إدخال سعر الفترة المسائية الأساسي');
        return false;
      }
      if (!hallForm.fullDayPrice || Number(hallForm.fullDayPrice) <= 0) {
        setFormError('يرجى إدخال سعر اليوم الكامل الترويجي للاعتماد');
        return false;
      }
    }
    setFormError('');
    return true;
  };

  const handleSaveHall = async (e?: React.FormEvent, confirmedPreSave = false) => {
    if (e) e.preventDefault();
    if (!canGoToNextStep()) return;

    if (!hallForm.pledge) {
      setFormError('يجب الموافقة والتعهد بصحة البيانات والمستندات المرفوعة للاعتماد في الخطوة الرابعة');
      setHallModalStep(4);
      return;
    }

    const mainCoverImage = hallForm.images.length > 0 ? hallForm.images[0] : (hallForm.image || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80');
    const finalCity = isCustomCity ? customCityName.trim() : hallForm.city;

    if (isCustomCity) {
      addAdminNotification(
        `طلب إضافة مدينة جديدة: ${customCityName}`,
        `المزود "${currentProviderName}" يرغب في إضافة مدينة "${customCityName}" التابعة لمنطقة "${hallForm.region}" غير الموجودة بالمخزن لقاعته "${hallForm.name}".`,
        'warning'
      );
    }

    const isPriceOrCapacityChanged = editingHall && (
      Number(editingHall.nightPrice) !== Number(hallForm.nightPrice) ||
      Number(editingHall.fullDayPrice) !== Number(hallForm.fullDayPrice) ||
      Number(editingHall.morningPrice) !== Number(hallForm.morningPrice) ||
      Number(editingHall.capacity) !== Number(hallForm.capacity)
    );

    const currentVersion = editingHall ? (editingHall.version || 1) : 1;
    const newVersion = isPriceOrCapacityChanged ? currentVersion + 1 : currentVersion;

    // Check for active bookings to trigger Pre-Save Impact Notification
    if (editingHall && isPriceOrCapacityChanged && !confirmedPreSave) {
      let activeBookings = 0;
      try {
        const raw = localStorage.getItem('ais_bookings_v2') || localStorage.getItem('layla_bookings');
        if (raw) {
          const bList = JSON.parse(raw);
          activeBookings = bList.filter((b: any) => 
            (String(b.hallId) === String(editingHall.id) || b.hall === editingHall.name) && 
            !['ملغي', 'مكتمل', 'منفذ'].includes(b.status)
          ).length;
        }
      } catch (e) {}

      if (activeBookings > 0) {
        setImpactModalData({
          entityName: hallForm.name,
          entityType: 'hall',
          version: newVersion,
          previousPrice: Number(editingHall.nightPrice),
          newPrice: Number(hallForm.nightPrice),
          activeBookingsCount: activeBookings,
          isPreSave: true
        });
        setIsImpactModalOpen(true);
        return;
      }
    }

    const payload = {
      ...hallForm,
      version: newVersion,
      lastPriceUpdate: isPriceOrCapacityChanged ? new Date().toISOString() : (editingHall?.lastPriceUpdate || new Date().toISOString()),
      city: finalCity,
      image: mainCoverImage,
      description: hallForm.about || hallForm.name,
      crFile: hallForm.crImage,
      vatFile: hallForm.vatImage,
      ibanFile: hallForm.ibanImage,
      status: hallForm.status === 'مفعل' ? 'مفعل' : 'معطل',
      bookingType: hallForm.bookingType || 'alacarte',
      packagesList: hallForm.packagesList || []
    };

    try {
      let savedHall;
      if (editingHall) {
        // Update DB
        const res = await fetch(`/api/bookings/halls/${editingHall.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('فشل الحفظ والتحديث في قاعدة البيانات الخارجية');
        savedHall = await res.json();
      } else {
        // Create DB
        const res = await fetch('/api/bookings/halls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('فشل إرسال وإدراج المرفق الجديد بقاعدة البيانات الخارجية');
        savedHall = await res.json();
      }

      // Sync local list
      let updatedHallsList = [...halls];
      if (editingHall) {
        updatedHallsList = updatedHallsList.map(h => h.id === editingHall.id ? { ...h, ...savedHall } : h);
      } else {
        updatedHallsList.push(savedHall);
      }

      saveStoredHalls(updatedHallsList);
      setIsHallModalOpen(false);
      setIsImpactModalOpen(false);

      // Versioning & Impact audit trail
      if (editingHall && isPriceOrCapacityChanged) {
        let activeBookings = 0;
        try {
          const raw = localStorage.getItem('ais_bookings_v2') || localStorage.getItem('layla_bookings');
          if (raw) {
            const bList = JSON.parse(raw);
            activeBookings = bList.filter((b: any) => 
              (String(b.hallId) === String(editingHall.id) || b.hall === editingHall.name) && 
              !['ملغي', 'مكتمل', 'منفذ'].includes(b.status)
            ).length;
          }
        } catch (e) {}

        recordAuditLog({
          entityType: 'hall',
          entityId: editingHall.id,
          entityName: hallForm.name,
          action: 'update',
          actorName: currentUser?.name || currentProviderName || 'المزود',
          actorRole: userRole,
          previousValues: { nightPrice: editingHall.nightPrice, fullDayPrice: editingHall.fullDayPrice, capacity: editingHall.capacity, version: currentVersion },
          newValues: { nightPrice: hallForm.nightPrice, fullDayPrice: hallForm.fullDayPrice, capacity: hallForm.capacity, version: newVersion },
          details: `تحديث البنود المالية والتعاقدية وترقية الإصدار إلى (v${newVersion})`,
          impactSummary: `حماية (${activeBookings}) حجز نشط سابق بالسعر المجمّد القديم؛ سريان v${newVersion} على الحجوزات المستقبلية فورياً.`
        });
      } else if (!editingHall) {
        recordAuditLog({
          entityType: 'hall',
          entityId: savedHall?.id || Date.now(),
          entityName: hallForm.name,
          action: 'create',
          actorName: currentUser?.name || currentProviderName || 'المزود',
          actorRole: userRole,
          newValues: { nightPrice: hallForm.nightPrice, fullDayPrice: hallForm.fullDayPrice, capacity: hallForm.capacity, version: 1 },
          details: 'إدراج قاعة جديدة لأول مرة بالإصدار الأساسي (v1)',
          impactSummary: 'إدراج جديد بانتظار الاعتماد الإداري والتشغيل'
        });
      }
    } catch (err: any) {
      setFormError('خطأ في مزامنة البيانات الخارجية: ' + err.message);
    }
  };

  const handleTogglePauseHall = (hallId: number | string) => {
    const target = halls.find(h => String(h.id) === String(hallId));
    if (!target) return;
    const isCurrentlyPaused = target.activationStatus === 'موقوف' || target.isPaused;
    const newActivationStatus = isCurrentlyPaused ? 'نشط' : 'موقوف';
    const newIsPaused = !isCurrentlyPaused;

    const updatedHalls = halls.map(h => {
      if (String(h.id) === String(hallId)) {
        return {
          ...h,
          activationStatus: newActivationStatus,
          isPaused: newIsPaused,
          pauseReason: newIsPaused ? 'إيقاف مؤقت للصيانة والتجديد الدوري' : undefined,
          pausedAt: newIsPaused ? new Date().toISOString() : undefined
        };
      }
      return h;
    });

    saveStoredHalls(updatedHalls);
    setHalls(updatedHalls);

    recordAuditLog({
      entityType: 'hall',
      entityId: hallId,
      entityName: target.name,
      action: 'status_change',
      actorName: currentUser?.name || currentProviderName || 'المزود',
      actorRole: userRole,
      previousValues: { activationStatus: target.activationStatus || 'نشط', isPaused: !!target.isPaused },
      newValues: { activationStatus: newActivationStatus, isPaused: newIsPaused },
      details: newIsPaused ? 'إيقاف مؤقت للقاعة (صيانة/تجديدات) مع إغلاق التقويم وبقاء الاعتماد سارياً' : 'استئناف تشغيل القاعة وفتح تقويم الحجز للعملاء بعد انتهاء الصيانة',
      impactSummary: newIsPaused ? 'إغلاق التقويم مؤقتاً دون الحاجة لإعادة طلب اعتماد جديد عند الاستئناف' : 'فتح التقويم فورياً للحجوزات الجديدة'
    });

    if (newIsPaused) {
      alert(`⏸️ تم إيقاف استقبال الحجوزات مؤقتاً لقاعة "${target.name}".\n\nتظل القاعة معتمدة وتاريخها محفوظ، مع إغلاق التقويم للعملاء مؤقتاً للصيانة. يمكنك إعادة تفعيلها بضغطة زر في أي وقت.`);
    } else {
      alert(`🟢 تم استئناف استقبال الحجوزات لقاعة "${target.name}" وفتح التقويم فورياً للعملاء.`);
    }
  };

  const handleDeleteHall = async (id: number) => {
    const targetHall = halls.find(h => h.id === id);
    const hallName = targetHall?.name || '';

    // Check related bookings from storage
    let storedBookings: any[] = [];
    try {
      const raw = localStorage.getItem('ais_bookings_v2') || localStorage.getItem('layla_bookings');
      if (raw) storedBookings = JSON.parse(raw);
    } catch (e) {}

    const related = storedBookings.filter(b => 
      String(b.hallId) === String(id) || 
      (hallName && (b.hall === hallName || b.hallName === hallName))
    );
    const active = related.filter(b => !['ملغي', 'مكتمل', 'منفذ'].includes(b.status));

    if (active.length > 0) {
      alert(`⚠️ حظر الإيقاف أو الحذف: يوجد (${active.length}) حجز مستقبلي نشط مرتبط بالقاعة. يجب استكمال التشغيل أو إلغاء الحجز عبر الإدارة أولاً.`);
      return;
    }

    if (related.length > 0) {
      // Historical bookings exist -> Soft Delete / Archival
      if (window.confirm(`تحتوي هذه القاعة على (${related.length}) حجز تاريخي منفذ وفواتير سابقة. سيتم نقل القاعة للأرشيف وإلغاؤها من العرض العام مع الحفاظ على سلامة كافة الفواتير والتقارير المالية. هل ترغب في المتابعة؟`)) {
        const updated = halls.map(h => {
          if (h.id === id) {
            return {
              ...h,
              isArchived: true,
              archivedAt: new Date().toISOString(),
              status: 'مؤرشفة',
              activationStatus: 'موقوف'
            };
          }
          return h;
        });
        saveStoredHalls(updated);
        setHalls(updated);
        alert('📦 تم نقل القاعة إلى الأرشيف وإلغاء إدراجها بنجاح مع حفظ سلامة السجلات المالية التاريخية.');
      }
      return;
    }

    // Zero bookings -> Clean direct delete
    if (window.confirm('هل أنت متأكد من حذف هذه القاعة الجديدة بشكل نهائي؟')) {
      try {
        const res = await fetch(`/api/bookings/halls/${id}`, {
          method: 'DELETE'
        });
        if (!res.ok) throw new Error('فشل الحذف من قاعدة البيانات الخارجية');
        const updated = halls.filter(h => h.id !== id);
        saveStoredHalls(updated);
        setHalls(updated);
      } catch (err: any) {
        alert('خطأ في حذف البيانات: ' + err.message);
      }
    }
  };

  // Package builder actions
  const handleSavePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgName.trim()) return;
    const basePrice = Number(pkgPrice) || 0;
    
    const packageData = {
      id: editingPkgId || Date.now().toString() + Math.random().toString(36).substr(2, 5),
      name: pkgName,
      price: basePrice,
      desc: pkgDesc,
      morningPrice: pkgMorningPrice ? Number(pkgMorningPrice) : undefined,
      nightPrice: pkgNightPrice ? Number(pkgNightPrice) : undefined,
      fullDayPrice: pkgFullDayPrice ? Number(pkgFullDayPrice) : undefined,
      isPopular: pkgIsPopular
    };

    setHallForm(prev => {
      let newList;
      if (editingPkgId) {
        newList = (prev.packagesList || []).map(p => p.id === editingPkgId ? packageData : p);
      } else {
        newList = [...(prev.packagesList || []), packageData];
      }
      return {
        ...prev,
        packagesList: newList
      };
    });

    setIsPkgModalOpen(false);
    setEditingPkgId(null);
    setPkgName('باقة الفخامة المتكاملة');
    setPkgPrice('15000');
    setPkgDesc('');
    setPkgMorningPrice('');
    setPkgNightPrice('');
    setPkgFullDayPrice('');
    setPkgIsPopular(false);
  };

  const handleDuplicatePackage = (pkg: any) => {
    const newPackage = {
      ...pkg,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      name: `${pkg.name} - نسخة`
    };
    setHallForm(prev => ({
      ...prev,
      packagesList: [...(prev.packagesList || []), newPackage]
    }));
  };

  // Service actions
  const handleOpenEditService = (service: EventService) => {
    setEditingService(service);
    setServiceForm({
      name: service.name || '',
      description: service.description || '',
      provider: service.provider || currentProviderName,
      price: service.price || 150,
      regions: service.regions || 'الرياض',
      cities: service.cities || 'الرياض',
      terms: service.terms || '',
      serviceStatus: service.serviceStatus === 'نشط' ? 'نشط' : 'معطل',
      adminStatus: service.adminStatus || 'فعالة',
      category: service.category || 'بوفيه وضيافة',
      city: service.city || 'الرياض',
      rating: service.rating || 4.5,
      quantityLimit: service.quantityLimit || '10',
      image: service.image || 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=500&q=60',
      images: Array.isArray(service.images) ? service.images : (service.image ? [service.image] : []),
      videoUrl: (service as any).videoUrl || ''
    });
    setServiceModalStep(1);
    setServiceFormError('');
    setIsServiceModalOpen(true);
  };

  const handleOpenAddService = () => {
    setEditingService(null);
    setServiceForm({
      name: '',
      description: '',
      provider: currentProviderName,
      price: 150,
      regions: 'الرياض',
      cities: 'الرياض',
      terms: '',
      serviceStatus: 'نشط',
      adminStatus: 'فعالة',
      category: 'بوفيه وضيافة',
      city: 'الرياض',
      rating: 4.5,
      quantityLimit: '10',
      image: 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=500&q=60',
      images: [],
      videoUrl: ''
    });
    setServiceModalStep(1);
    setServiceFormError('');
    setIsServiceModalOpen(true);
  };

  const canGoToNextServiceStep = () => {
    if (serviceModalStep === 1) {
      if (!serviceForm.name.trim()) {
        setServiceFormError('يرجى كتابة اسم باقة الخدمة للاستمرار');
        return false;
      }
      if (!serviceForm.price || Number(serviceForm.price) <= 0) {
        setServiceFormError('سعر باقة الخدمة يجب أن يكون قيمة موجبة أكبر من صفر لتفعيلها لعملائك');
        return false;
      }
    }
    setServiceFormError('');
    return true;
  };

  const handleSaveService = async (e?: React.FormEvent, confirmedPreSave = false) => {
    if (e) e.preventDefault();
    
    // Step 1 Validation
    if (!serviceForm.name.trim()) {
      setServiceModalStep(1);
      setServiceFormError('يرجى كتابة اسم باقة الخدمة أولاً');
      return;
    }
    if (!serviceForm.price || Number(serviceForm.price) <= 0) {
      setServiceModalStep(1);
      setServiceFormError('سعر باقة الخدمة يجب أن يكون قيمة موجبة أكبر من صفر لتفعيلها لعملائك');
      return;
    }

    // Step 2 Validation
    if (!serviceForm.description.trim()) {
      setServiceModalStep(2);
      setServiceFormError('يرجى كتابة تفاصيل ووصف باقة الخدمة لتوضيحها لعملائك');
      return;
    }

    const mainCoverImage = serviceForm.images.length > 0 ? serviceForm.images[0] : (serviceForm.image || 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=500&q=60');

    const isServicePriceChanged = editingService && (
      Number(editingService.price) !== Number(serviceForm.price)
    );

    const currentServiceVersion = editingService ? (editingService.version || 1) : 1;
    const newServiceVersion = isServicePriceChanged ? currentServiceVersion + 1 : currentServiceVersion;

    // Check for active service requests to trigger Pre-Save Impact Notification
    if (editingService && isServicePriceChanged && !confirmedPreSave) {
      let activeRequests = 0;
      try {
        const raw = localStorage.getItem('layla_service_requests') || localStorage.getItem('ais_service_requests_v2');
        if (raw) {
          const reqList = JSON.parse(raw);
          activeRequests = reqList.filter((r: any) => 
            (String(r.serviceId) === String(editingService.id) || r.serviceName === editingService.name) && 
            !['ملغي', 'مكتمل', 'تم التنفيذ'].includes(r.status)
          ).length;
        }
      } catch (e) {}

      if (activeRequests > 0) {
        setImpactModalData({
          entityName: serviceForm.name,
          entityType: 'service',
          version: newServiceVersion,
          previousPrice: Number(editingService.price),
          newPrice: Number(serviceForm.price),
          activeBookingsCount: activeRequests,
          isPreSave: true
        });
        setIsImpactModalOpen(true);
        return;
      }
    }

    const payload = {
      ...serviceForm,
      version: newServiceVersion,
      image: mainCoverImage,
      provider: currentProviderName,
      status: userRole === 'admin' ? ((serviceForm as any).status || 'approved') : 'pending',
      adminStatus: userRole === 'admin' ? serviceForm.adminStatus : 'pending'
    };

    try {
      let savedService;
      if (editingService) {
        // Update DB
        const res = await fetch(`/api/services/${editingService.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-role': userRole,
            'x-user-name': encodeURIComponent(currentProviderName || '')
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('فشل الحفظ والتحديث في قاعدة البيانات الخارجية');
        savedService = await res.json();
      } else {
        // Create DB
        const res = await fetch('/api/services', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-role': userRole,
            'x-user-name': encodeURIComponent(currentProviderName || '')
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('فشل إرسال وإدراج الخدمة الجديدة بقاعدة البيانات الخارجية');
        savedService = await res.json();
      }

      // Sync local list
      let updatedServicesList = [...services];
      if (editingService) {
        updatedServicesList = updatedServicesList.map(s => s.id === editingService.id ? { ...s, ...savedService } : s);
      } else {
        updatedServicesList.push(savedService);
      }

      saveServices(updatedServicesList);
      setServices(updatedServicesList);
      setIsServiceModalOpen(false);
      setIsImpactModalOpen(false);

      if (editingService && isServicePriceChanged) {
        let activeRequests = 0;
        try {
          const raw = localStorage.getItem('layla_service_requests') || localStorage.getItem('ais_service_requests_v2');
          if (raw) {
            const reqList = JSON.parse(raw);
            activeRequests = reqList.filter((r: any) => 
              (String(r.serviceId) === String(editingService.id) || r.serviceName === editingService.name) && 
              !['ملغي', 'مكتمل', 'تم التنفيذ'].includes(r.status)
            ).length;
          }
        } catch (e) {}

        recordAuditLog({
          entityType: 'service',
          entityId: editingService.id,
          entityName: serviceForm.name,
          action: 'update',
          actorName: currentUser?.name || currentProviderName || 'المزود',
          actorRole: userRole,
          previousValues: { price: editingService.price, version: currentServiceVersion },
          newValues: { price: serviceForm.price, version: newServiceVersion },
          details: `تحديث سعر باقة الخدمة وترقية الإصدار إلى (v${newServiceVersion})`,
          impactSummary: `حماية (${activeRequests}) طلب خدمة قائم مسبقاً بالسعر القديم المجمّد؛ سريان v${newServiceVersion} على الطلبات الجديدة فورياً.`
        });
      } else if (!editingService) {
        recordAuditLog({
          entityType: 'service',
          entityId: savedService?.id || Date.now(),
          entityName: serviceForm.name,
          action: 'create',
          actorName: currentUser?.name || currentProviderName || 'المزود',
          actorRole: userRole,
          newValues: { price: serviceForm.price, version: 1 },
          details: 'إدراج باقة خدمة جديدة لأول مرة بالإصدار الأساسي (v1)',
          impactSummary: 'إدراج جديد بانتظار الاعتماد الإداري والتشغيل'
        });
      }
    } catch (err: any) {
      setServiceFormError('خطأ في مزامنة البيانات الخارجية: ' + err.message);
    }
  };

  const handleTogglePauseService = (serviceId: number | string) => {
    const target = services.find(s => String(s.id) === String(serviceId));
    if (!target) return;
    const isCurrentlyPaused = target.serviceStatus === 'موقوف' || target.isPaused;
    const newStatus = isCurrentlyPaused ? 'نشط' : 'موقوف';
    const newIsPaused = !isCurrentlyPaused;

    const updatedServices = services.map(s => {
      if (String(s.id) === String(serviceId)) {
        return {
          ...s,
          serviceStatus: newStatus,
          isPaused: newIsPaused,
          pauseReason: newIsPaused ? 'إيقاف مؤقت للتجهيز والتحديث' : undefined,
          pausedAt: newIsPaused ? new Date().toISOString() : undefined
        };
      }
      return s;
    });

    saveServices(updatedServices);
    setServices(updatedServices);

    recordAuditLog({
      entityType: 'service',
      entityId: serviceId,
      entityName: target.name,
      action: 'status_change',
      actorName: currentUser?.name || currentProviderName || 'المزود',
      actorRole: userRole,
      previousValues: { serviceStatus: target.serviceStatus || 'نشط', isPaused: !!target.isPaused },
      newValues: { serviceStatus: newStatus, isPaused: newIsPaused },
      details: newIsPaused ? 'إيقاف مؤقت للخدمة مع إغلاق استقبال الطلبات مؤقتاً' : 'استئناف استقبال طلبات الخدمة فورياً',
      impactSummary: newIsPaused ? 'إيقاف مؤقت دون الحاجة لإعادة طلب اعتماد جديد' : 'فتح الطلب فورياً للعملاء'
    });

    if (newIsPaused) {
      alert(`⏸️ تم إيقاف استقبال طلبات خدمة "${target.name}" مؤقتاً.`);
    } else {
      alert(`🟢 تم استئناف استقبال طلبات خدمة "${target.name}" فورياً.`);
    }
  };

  const handleDeleteService = async (id: number) => {
    const targetService = services.find(s => s.id === id);
    const sName = targetService?.name || '';

    // Check related service requests from storage
    let storedRequests: any[] = [];
    try {
      const raw = localStorage.getItem('layla_service_requests') || localStorage.getItem('ais_service_requests_v2');
      if (raw) storedRequests = JSON.parse(raw);
    } catch (e) {}

    const related = storedRequests.filter(r => 
      String(r.serviceId) === String(id) || 
      (sName && (r.serviceName === sName || r.name === sName))
    );
    const active = related.filter(r => !['ملغي', 'مكتمل', 'تم التنفيذ'].includes(r.status));

    if (active.length > 0) {
      alert(`⚠️ حظر الإيقاف أو الحذف: يوجد (${active.length}) طلب خدمة قائم لم يتم تنفيذه بعد.`);
      return;
    }

    if (related.length > 0) {
      // Historical requests exist -> Soft Delete / Archival
      if (window.confirm(`تحتوي هذه الخدمة على (${related.length}) طلب وعملية تاريخية سابقة وفواتير مسجلة. سيتم نقل الخدمة للأرشيف وإلغاؤها من العرض العام مع حفظ كافة السجلات المالية. هل ترغب في المتابعة؟`)) {
        const updated = services.map(s => {
          if (s.id === id) {
            return {
              ...s,
              isArchived: true,
              archivedAt: new Date().toISOString(),
              serviceStatus: 'مؤرشفة',
              adminStatus: 'مؤرشفة'
            };
          }
          return s;
        });
        saveServices(updated);
        setServices(updated);
        alert('📦 تم نقل الخدمة إلى الأرشيف وإلغاء إدراجها بنجاح مع حفظ كافة السجلات المالية التاريخية.');
      }
      return;
    }

    // Zero requests -> Clean direct delete
    if (window.confirm('هل أنت متأكد من حذف باقة الخدمة هذه بشكل نهائي؟')) {
      try {
        const res = await fetch(`/api/services/${id}`, {
          method: 'DELETE',
          headers: {
            'x-user-role': userRole,
            'x-user-name': encodeURIComponent(currentProviderName || '')
          }
        });
        if (!res.ok) throw new Error('فشل الحذف من قاعدة البيانات الخارجية');
        const updated = services.filter(s => s.id !== id);
        saveServices(updated);
        setServices(updated);
      } catch (err: any) {
        alert('خطأ في حذف البيانات: ' + err.message);
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-center font-sans" dir="rtl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col text-right selection:bg-amber-100 selection:text-amber-800" dir="rtl" id="halls-services-portal-page">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto px-4 md:px-6 w-full py-10">
        {/* Upper Banner Breadcrumb */}
        <div className="bg-gradient-to-l from-blue-950 to-indigo-900 rounded-3xl p-8 md:p-10 text-white shadow-xl relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-bold border border-amber-400/20">
                <Sparkles className="w-3.5 h-3.5" /> بوابة الواجهة الأمامية الحصرية للأعضاء
              </span>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-1">بوابة إدارة القاعات والخدمات المساندة 💫</h1>
              <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
                تحكم كامل ومباشر في عروضك ومنشآتك المسجلة. يمكنك الإضافة والتعديل والتحكم بكل مرونة، بطريقة آمنة وسرية تماماً لا يمكن الوصول إليها إلا للمزودين والمسؤولين المصرح لهم.
              </p>
            </div>

            {/* Quick Status Pill and Navigation */}
            <div className="flex flex-col md:flex-row items-center gap-3">
              <Link
                to="/provider-dashboard?tab=halls"
                className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs rounded-2xl shadow-lg transition-all flex items-center gap-2 border border-amber-400/30"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>الانتقال للوحة التحكم الموحدة 👑</span>
              </Link>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center md:text-right">
                <p className="text-xs text-slate-300 leading-none">مستوى الحساب المكتشف</p>
                <h4 className="text-lg font-black text-amber-400 mt-1">{userRole === 'admin' ? 'مدير النظام المركزي' : 'مزود خدمة معتمد'}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">{currentProviderName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Controller Rail: Search, Regions Filter and Tabs Switcher */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 mb-8 space-y-6">
          {/* First Row: Tabs & Action Trigger Button */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-50 pb-5">
            {/* Tabs Switcher & Results Counter Group */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {/* Tabs Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-xl gap-1 shrink-0 self-start">
                <button
                  type="button"
                  onClick={() => { setActiveTab('halls'); handleResetFilters(); }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black transition-all ${
                    activeTab === 'halls'
                      ? 'bg-white text-blue-950 shadow-sm border border-slate-200/50'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Building2 className={`w-4 h-4 ${activeTab === 'halls' ? 'text-amber-500' : ''}`} />
                  <span>القاعات والمنشآت المضافة</span>
                  <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px]">{displayedHalls.length}</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => { setActiveTab('services'); handleResetFilters(); }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black transition-all ${
                    activeTab === 'services'
                      ? 'bg-white text-blue-950 shadow-sm border border-slate-200/50'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Package className={`w-4 h-4 ${activeTab === 'services' ? 'text-indigo-600' : ''}`} />
                  <span>الخدمات المساندة والباقات</span>
                  <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px]">{displayedServices.length}</span>
                </button>
              </div>

              {/* Dynamic Results Counter / Dataset Summary Indicator (strictly to the left of the tab switcher in RTL flow) */}
              <div className="text-xs text-slate-500 font-bold bg-[#162556]/5 px-3 py-2 rounded-xl border border-slate-100/70 shrink-0 h-9 flex items-center shadow-xs">
                تم العثور على&nbsp;
                <span className="text-[#162556] font-black underline decoration-amber-400 decoration-2 px-0.5">
                  {activeTab === 'halls' ? displayedHalls.length : displayedServices.length}
                </span>
                &nbsp;
                {activeTab === 'halls' ? 'قاعة ومنشأة مستقلة' : 'باقة وخدمة معتمدة'}
              </div>
            </div>

            {/* Action Trigger Button */}
            <button
              type="button"
              onClick={activeTab === 'halls' ? handleOpenAddHall : handleOpenAddService}
              className="flex items-center justify-center gap-1.5 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all transform active:scale-98 shrink-0 cursor-pointer self-start lg:self-center"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{activeTab === 'halls' ? 'إضافة منشأة جديدة' : 'إضافة باقة خدمة'}</span>
            </button>
          </div>

          {/* Complex Filter Grid & Combined Interactive Dashboard Controls on the far left */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Right side: Selection filter inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 flex-1">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={activeTab === 'halls' ? "ابحث بالاسم، المدينة، أو المالك..." : "ابحث بالاسم، الوصف، أو المزود..."}
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200/80 outline-none focus:border-amber-500 transition-colors text-xs font-medium bg-slate-50/50 placeholder:text-slate-400 text-slate-900"
                />
              </div>

              {/* Region Filter */}
              <div className="space-y-1">
                <select
                  value={selectedRegion}
                  onChange={e => { setSelectedRegion(e.target.value); setSelectedCity(''); setCurrentPage(1); }}
                  className="w-full p-2.5 rounded-xl border border-slate-200/80 outline-none focus:border-amber-500 bg-slate-50 text-xs text-slate-700"
                >
                  <option value="">كل المناطق الجغرافية</option>
                  {SAUDI_REGIONS.map(r => (
                    <option key={r.name} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>

              {/* City Filter */}
              <div className="space-y-1">
                <select
                  value={selectedCity}
                  onChange={e => { setSelectedCity(e.target.value); setCurrentPage(1); }}
                  disabled={!selectedRegion}
                  className="w-full p-2.5 rounded-xl border border-slate-200/80 outline-none focus:border-amber-500 bg-slate-50 text-xs text-slate-700 disabled:opacity-50"
                >
                  <option value="">كل المدن</option>
                  {filterCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Category Filter (التصنيف النوعي) */}
              <div className="space-y-1">
                <select
                  value={selectedCategory}
                  onChange={e => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                  className="w-full p-2.5 rounded-xl border border-slate-200/80 outline-none focus:border-amber-500 bg-slate-50 text-xs text-slate-700"
                >
                  <option value="">كل تصنيفات {activeTab === 'halls' ? 'المنشآت' : 'الخدمات'}</option>
                  {activeTab === 'halls' ? (
                    <>
                      {hallCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </>
                  ) : (
                    <>
                      {serviceCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              {/* Provider Filter (فرز أصحاب الصلاحية/المزودين) - يتاح للإدارة العامة فقط */}
              {userRole === 'admin' && (
                <div className="space-y-1">
                  <select
                    value={selectedProvider}
                    onChange={e => { setSelectedProvider(e.target.value); setCurrentPage(1); }}
                    className="w-full p-2.5 rounded-xl border border-slate-200/80 outline-none focus:border-amber-500 bg-slate-50 text-xs text-slate-700 font-medium"
                  >
                    <option value="">كل مزودي الخدمة / الملاك</option>
                    {uniqueProviders.map(provider => (
                      <option key={provider} value={provider}>{provider}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Administrative Status Filter (الحالة التشغيلية) */}
              <div className="space-y-1">
                <select
                  value={selectedStatus}
                  onChange={e => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                  className="w-full p-2.5 rounded-xl border border-slate-200/80 outline-none focus:border-amber-500 bg-slate-50 text-xs text-slate-700"
                >
                  <option value="">كل الحالات التشغيلية</option>
                  <option value="مفعل">فعالة / نشطة ومفعلة للزوار</option>
                  <option value="معطل">موقوفة / معطلة مؤقتاً</option>
                  <option value="بانتظار الاعتماد">بانتظار الموافقة والاعتماد الإداري</option>
                </select>
              </div>
            </div>

            {/* Left side: Packed Interactive Control Group - Organized in 2 rows on the far left (RTL) */}
            <div className="flex flex-col items-end gap-2.5 shrink-0 self-start lg:self-center">
              {/* Row 1: Reset Filters (Top Left) */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="h-9 w-9 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all border border-red-100/80 cursor-pointer flex items-center justify-center shrink-0 group shadow-xs"
                  title="تصفير ومسح كافة فلاتر البحث"
                >
                  <RotateCcw className="w-4 h-4 text-red-500 group-hover:rotate-180 duration-500 transition-transform" />
                </button>
              </div>

              {/* Row 2: Sorting Dropdown & Interactive View Switcher (Bottom Left) */}
              <div className="flex items-center gap-2.5 justify-end">
                {/* Sorting Engine Dropdown Button */}
                <div className="relative" id="sort-dropdown-container">
                  <button
                    type="button"
                    onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                    className="h-9 w-9 rounded-xl border border-slate-200/80 transition-all flex items-center justify-center bg-white shadow-xs hover:bg-slate-50 text-[#162556] cursor-pointer"
                    title="الفرز والجدولة"
                  >
                    <SortIcon sortOrder={sortOrder} />
                  </button>

                  <AnimatePresence>
                    {isSortDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -5 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute left-0 mt-2 w-56 bg-white rounded-2xl border border-slate-100 shadow-xl py-2 z-50 origin-top-left font-sans"
                      >
                        {sortGroups.map((group, groupIdx) => (
                          <div key={group.id}>
                            {groupIdx > 0 && <div className="border-t border-slate-100 my-1" />}
                            {group.options.map((option) => {
                              const isSelected = sortOrder === option.value;
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => {
                                    setSortOrder(option.value);
                                    setCurrentPage(1);
                                    setIsSortDropdownOpen(false);
                                  }}
                                  className={`w-full text-right px-4 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs font-semibold ${
                                    isSelected ? 'text-[#162556] bg-blue-50/40 font-black' : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  <span>{option.label}</span>
                                  {isSelected && (
                                    <Check className="w-3.5 h-3.5 text-[#162556] stroke-[3]" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Interactive View Switcher - Custom Ordering: Tabular, List, Grid */}
                <div className="flex bg-slate-100 p-1 rounded-xl gap-1 h-9 items-center shrink-0 border border-slate-250/20 shadow-xs">
                  {/* Tabular View (العرض الجدولي - أولا على اليمين في RTL) */}
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`h-7 w-7 rounded-lg transition-all flex items-center justify-center ${
                      viewMode === 'table'
                        ? 'bg-white text-blue-950 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="العرض الجدولى (Tabular View)"
                  >
                    <Table className="w-4 h-4 text-[#162556]" />
                  </button>

                  {/* List View (العرض القائم - ثانيا) */}
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`h-7 w-7 rounded-lg transition-all flex items-center justify-center ${
                      viewMode === 'list'
                        ? 'bg-white text-blue-950 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="العرض القائم (List View)"
                  >
                    <List className="w-4 h-4 text-[#162556]" />
                  </button>

                  {/* Grid View (العرض الشبكي - ثالثا على اليسار) */}
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`h-7 w-7 rounded-lg transition-all flex items-center justify-center ${
                      viewMode === 'grid'
                        ? 'bg-white text-blue-950 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="العرض الشبكي (Grid View)"
                  >
                    <LayoutGrid className="w-4 h-4 text-[#162556]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Lists rendering */}
        {activeTab === 'halls' ? (
          /* Halls Views */
          displayedHalls.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-xs">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-500">
                <Building2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-800">لا توجد منشآت مطابقة</h3>
              <p className="text-slate-400 text-xs mt-1.5 max-w-sm mx-auto">
                {userRole === 'provider' 
                  ? 'لم تقم بإضافة أي قاعات معتمدة تلائم المرشحات الحالية.' 
                  : 'لم يعثر البحث على قاعات مطابقة لشروط التصفية والفرز الحالية.'}
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> مسح كل الفلاتر
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedHalls.map((hall) => (
                <div 
                  key={hall.id}
                  className={`bg-white rounded-3xl overflow-hidden border shadow-xs hover:shadow-md transition-all duration-300 flex flex-col group relative ${
                    hall.activationStatus === 'موقوف' || hall.isPaused ? 'border-amber-200 bg-amber-50/20' : 'border-slate-100'
                  }`}
                  id={`hall-card-${hall.id}`}
                >
                  {/* Status Badges */}
                  <div className="absolute top-4 right-4 z-10 flex flex-wrap gap-1.5 font-sans">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-900/80 backdrop-blur-xs text-amber-300 border border-amber-400/30 flex items-center gap-1 shadow-xs" title="رقم إصدار الكتالوج">
                      <GitBranch className="w-3 h-3 text-amber-300" />
                      v{hall.version || 1}
                    </span>
                    {(hall.activationStatus === 'موقوف' || hall.isPaused) ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black shadow-xs bg-amber-500 text-white flex items-center gap-1">
                        <PauseCircle className="w-3 h-3" />
                        موقوفة مؤقتاً
                      </span>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black shadow-xs ${
                        (hall.status === 'مفعل' || hall.status === 'نشط') ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                      }`}>
                        {(hall.status === 'مفعل' || hall.status === 'نشط') ? 'مفعلة' : 'معطلة'}
                      </span>
                    )}
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black shadow-xs ${
                      hall.bookingStatus === 'محجوز' ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'
                    }`}>
                      {hall.bookingStatus === 'محجوز' ? 'محجوزة' : 'متاحة للحجز'}
                    </span>
                  </div>

                  {/* Hall Image Shield */}
                  <div className="h-48 w-full bg-slate-100 relative overflow-hidden shrink-0">
                    {(hall as any).videoUrl ? (
                      <video 
                        src={(hall as any).videoUrl} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                      />
                    ) : (
                      <img 
                        src={hall.image || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80'} 
                        alt={hall.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                    <div className="absolute bottom-3 right-3 text-white">
                      <span className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold">
                        {hall.category || 'قاعة'}
                      </span>
                    </div>
                  </div>

                  {/* Details Body */}
                  <div className="p-5 flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h3 className="text-md font-bold text-slate-800 leading-snug group-hover:text-amber-500 transition-colors line-clamp-1 flex-1">{hall.name}</h3>
                        <button 
                          onClick={(e) => openProviderChat(e, hall.provider, hall.name)}
                          className="text-amber-500 hover:text-amber-600 hover:bg-amber-50 transition-all p-1.5 rounded-lg shrink-0" 
                          title="مراسلة المزود"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Provider Credit */}
                      <p className="text-[10px] text-slate-400 flex items-center mb-4">
                        <span className="font-semibold text-slate-600 ml-1">بواسطة:</span> {hall.provider}
                      </p>

                      <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-[11px] text-slate-500 mb-5 pb-5 border-b border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate">{hall.city}، {hall.region}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>السعة: {hall.capacity || 'غير محدد'} شخص</span>
                        </div>
                        <div className="flex items-center gap-1.5 col-span-2">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>السعر (كامل اليوم): <strong className="text-emerald-700 text-xs">{(hall.fullDayPrice || 10000).toLocaleString('ar-SA')} ر.س</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between gap-2 pt-1 font-sans">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditHall(hall)}
                          className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
                          title="تعديل المنشأة والأسعار"
                          id={`edit-hall-btn-${hall.id}`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleTogglePauseHall(hall.id)}
                          className={`p-2 rounded-xl transition-colors cursor-pointer ${
                            (hall.activationStatus === 'موقوف' || hall.isPaused)
                              ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                              : 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                          }`}
                          title={(hall.activationStatus === 'موقوف' || hall.isPaused) ? 'استئناف استقبال الحجوزات وفتح التقويم' : 'إيقاف مؤقت للصيانة والتجديد الدوري'}
                        >
                          {(hall.activationStatus === 'موقوف' || hall.isPaused) ? (
                            <PlayCircle className="w-4 h-4" />
                          ) : (
                            <PauseCircle className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAuditEntity({ type: 'hall', id: hall.id, name: hall.name });
                            setIsAuditModalOpen(true);
                          }}
                          className="p-2 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors cursor-pointer"
                          title="سجل الإصدارات والتغييرات (Audit Log)"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteHall(hall.id)}
                          className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors cursor-pointer"
                          title="حذف / أرشفة القاعة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => navigate(`/hall/${hall.id}`)}
                        className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-black text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>رؤية بالواجهة العامة</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : viewMode === 'list' ? (
            /* List View */
            <div className="flex flex-col gap-4">
              {displayedHalls.map((hall) => (
                <div 
                  key={hall.id}
                  className={`bg-white rounded-3xl overflow-hidden border p-5 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col md:flex-row gap-6 relative group ${
                    hall.activationStatus === 'موقوف' || hall.isPaused ? 'border-amber-200 bg-amber-50/20' : 'border-slate-100'
                  }`}
                  id={`hall-list-${hall.id}`}
                >
                  {/* Status Badges */}
                  <div className="absolute top-4 right-4 z-10 flex flex-wrap gap-1.5 font-sans">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-900/80 backdrop-blur-xs text-amber-300 border border-amber-400/30 flex items-center gap-1 shadow-xs">
                      <GitBranch className="w-3 h-3 text-amber-300" />
                      v{hall.version || 1}
                    </span>
                    {(hall.activationStatus === 'موقوف' || hall.isPaused) ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black shadow-xs bg-amber-500 text-white flex items-center gap-1">
                        <PauseCircle className="w-3 h-3" />
                        موقوفة مؤقتاً
                      </span>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black shadow-xs ${
                        (hall.status === 'مفعل' || hall.status === 'نشط') ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                      }`}>
                        {(hall.status === 'مفعل' || hall.status === 'نشط') ? 'مفعلة' : 'معطلة'}
                      </span>
                    )}
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black shadow-xs ${
                      hall.bookingStatus === 'محجوز' ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'
                    }`}>
                      {hall.bookingStatus === 'محجوز' ? 'محجوزة' : 'متاحة'}
                    </span>
                  </div>

                  {/* Image shield */}
                  <div className="w-full md:w-60 h-40 bg-slate-100 rounded-2xl overflow-hidden shrink-0">
                    <img 
                      src={hall.image || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80'} 
                      alt={hall.name}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-grow flex flex-col justify-between pt-4 md:pt-0">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-black">{hall.category || 'قاعة'}</span>
                        <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-medium">{hall.city}</span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <h3 className="text-md font-bold text-slate-800 hover:text-amber-500 transition-colors flex-1">{hall.name}</h3>
                        <button 
                          onClick={(e) => openProviderChat(e, hall.provider, hall.name)}
                          className="text-amber-500 hover:text-amber-600 hover:bg-amber-50 transition-all p-1.5 rounded-lg shrink-0" 
                          title="مراسلة المزود"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">بواسطة المزود: {hall.provider}</p>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px] text-slate-500 mt-4">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-500" />
                          <span>📍 العنوان: {hall.address || 'العنوان المسجل'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-blue-500" />
                          <span>👥 السعة: {hall.capacity || 'غير محدد'} شخص</span>
                        </div>
                        <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                          <span>السعر: <strong className="text-emerald-700 font-bold">{(hall.fullDayPrice || 10000).toLocaleString('ar-SA')} ر.س</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-1 mt-5 pt-4 border-t border-slate-50 font-sans">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditHall(hall)}
                          className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
                          title="تعديل"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleTogglePauseHall(hall.id)}
                          className={`p-2 rounded-xl transition-colors cursor-pointer ${
                            (hall.activationStatus === 'موقوف' || hall.isPaused)
                              ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                              : 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                          }`}
                          title={(hall.activationStatus === 'موقوف' || hall.isPaused) ? 'استئناف استقبال الحجوزات' : 'إيقاف مؤقت للصيانة'}
                        >
                          {(hall.activationStatus === 'موقوف' || hall.isPaused) ? (
                            <PlayCircle className="w-4 h-4" />
                          ) : (
                            <PauseCircle className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAuditEntity({ type: 'hall', id: hall.id, name: hall.name });
                            setIsAuditModalOpen(true);
                          }}
                          className="p-2 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors cursor-pointer"
                          title="سجل الإصدارات (Audit Log)"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteHall(hall.id)}
                          className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors cursor-pointer"
                          title="حذف / أرشفة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => navigate(`/hall/${hall.id}`)}
                        className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-black text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>رؤية بالواجهة العامة</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Tabular View (العرض الجدولي مع محدد عدد الصفوف والترقيم) */
            <div className="space-y-4">
              <div className="bg-white rounded-3xl border border-slate-150/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold font-sans">
                        <th className="p-4">اسم المنشأة والقاعة</th>
                        <th className="p-4 text-center">الإصدار</th>
                        <th className="p-4">التصنيف النوعي</th>
                        <th className="p-4">المدينة والمنطقة</th>
                        {userRole === 'admin' && <th className="p-4">المزود / المالك</th>}
                        <th className="p-4 text-center">السعة بـ(شخص)</th>
                        <th className="p-4">السعر المسائي</th>
                        <th className="p-4">اليوم الكامل</th>
                        <th className="p-4 text-center">حالة الحجز</th>
                        <th className="p-4 text-center">حالة التشغيل</th>
                        <th className="p-4 text-center">الإجراءات والتحكم</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedHalls.map((hall) => (
                        <tr key={hall.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors font-semibold">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img src={hall.image} className="w-10 h-10 object-cover rounded-lg shadow-xs" referrerPolicy="no-referrer" />
                              <span className="font-black text-slate-800">{hall.name}</span>
                              <button 
                                onClick={(e) => openProviderChat(e, hall.provider, hall.name)}
                                className="text-amber-500 hover:text-amber-600 hover:bg-amber-50 transition-all p-1.5 rounded-lg shrink-0 mr-1.5" 
                                title="مراسلة المزود"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-900 text-amber-300">
                              v{hall.version || 1}
                            </span>
                          </td>
                          <td className="p-4 text-slate-600">
                            <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">{hall.category || 'قاعة'}</span>
                          </td>
                          <td className="p-4 text-slate-500 text-[11px]">{hall.city}، {hall.region}</td>
                          {userRole === 'admin' && <td className="p-4 text-slate-700 font-bold">{hall.provider}</td>}
                          <td className="p-4 text-center font-bold text-slate-800">{hall.capacity} شخص</td>
                          <td className="p-4 text-emerald-700 font-bold font-sans">{(hall.nightPrice || 10000).toLocaleString('ar-SA')} ر.س</td>
                          <td className="p-4 text-indigo-750 font-black font-sans">{(hall.fullDayPrice || 13000).toLocaleString('ar-SA')} ر.س</td>
                          <td className="p-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${hall.bookingStatus === 'محجوز' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                              {hall.bookingStatus === 'محجوز' ? 'محجوزة' : 'متاحة'}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            {(hall.activationStatus === 'موقوف' || hall.isPaused) ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600">
                                ⏸️ موقوفة للصيانة
                              </span>
                            ) : (
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${(hall.status === 'مفعل' || hall.status === 'نشط') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                {(hall.status === 'مفعل' || hall.status === 'نشط') ? 'مفعلة' : 'معطلة'}
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex justify-center items-center gap-1.5">
                              <button onClick={() => handleOpenEditHall(hall)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="تعديل"><Edit3 className="w-4 h-4" /></button>
                              <button 
                                onClick={() => handleTogglePauseHall(hall.id)} 
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  (hall.activationStatus === 'موقوف' || hall.isPaused) ? 'text-emerald-700 hover:bg-emerald-50' : 'text-amber-600 hover:bg-amber-50'
                                }`} 
                                title={(hall.activationStatus === 'موقوف' || hall.isPaused) ? 'استئناف التشغيل' : 'إيقاف مؤقت للصيانة'}
                              >
                                {(hall.activationStatus === 'موقوف' || hall.isPaused) ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedAuditEntity({ type: 'hall', id: hall.id, name: hall.name });
                                  setIsAuditModalOpen(true);
                                }} 
                                className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer" 
                                title="سجل الإصدارات (Audit Log)"
                              >
                                <History className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteHall(hall.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="حذف / أرشفة"><Trash2 className="w-4 h-4" /></button>
                              <button onClick={() => navigate(`/hall/${hall.id}`)} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="معاينة"><Eye className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Rows Per Page Dropdown & Tabular Paging Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <span>عدد الأسطر المعروضة:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="p-1.5 rounded-lg border border-slate-200 outline-none focus:border-amber-500 bg-slate-50 text-slate-800"
                  >
                    <option value={10}>10 صفوف</option>
                    <option value={25}>25 صفاً</option>
                    <option value={50}>50 صفاً</option>
                    <option value={100}>100 صف</option>
                  </select>
                </div>

                <div className="flex items-center gap-4 font-sans">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-slate-700">
                    صفحة {currentPage} من {totalHallsPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalHallsPages))}
                    disabled={currentPage === totalHallsPages}
                    className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        ) : (
          /* Supplementary Services Layout */
          displayedServices.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-xs">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-500">
                <Package className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-800">لا توجد خدمات مطابقة</h3>
              <p className="text-slate-400 text-xs mt-1.5 max-w-sm mx-auto">
                {userRole === 'provider' 
                  ? 'لم تقم بإضافة أي خدمات مساندة تلائم المرشحات الحالية.'
                  : 'لم نجد أي خدمات مساندة مسجلة تلائم معايير البحث والفرز الحالية.'}
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> مسح الفلاتر
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* Services Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedServices.map((service) => (
                <div 
                  key={service.id}
                  className={`bg-white rounded-3xl overflow-hidden border shadow-xs hover:shadow-md transition-all duration-300 flex flex-col group relative ${
                    service.isPaused || service.serviceStatus === 'موقوفة' ? 'border-amber-200 bg-amber-50/20' : 'border-slate-100'
                  }`}
                  id={`service-card-${service.id}`}
                >
                  {/* Status Badges */}
                  <div className="absolute top-4 right-4 z-10 flex flex-wrap gap-1.5 font-sans">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-900/80 backdrop-blur-xs text-indigo-300 border border-indigo-400/30 flex items-center gap-1 shadow-xs" title="رقم إصدار الخدمة">
                      <GitBranch className="w-3 h-3 text-indigo-300" />
                      v{service.version || 1}
                    </span>
                    {(service.isPaused || service.serviceStatus === 'موقوفة') ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black shadow-xs bg-amber-500 text-white flex items-center gap-1">
                        <PauseCircle className="w-3 h-3" />
                        موقوفة مؤقتاً
                      </span>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black shadow-xs ${
                        (service.serviceStatus === 'متاحة' || service.serviceStatus === 'نشط' || service.serviceStatus === 'فعال') 
                          ? 'bg-emerald-500 text-white' 
                          : (service.serviceStatus === 'غير متوفرة' || service.serviceStatus === 'غير متوفره') 
                            ? 'bg-amber-500 text-white' 
                            : 'bg-red-500 text-white'
                      }`}>
                        {service.serviceStatus === 'متاحة' || service.serviceStatus === 'نشط' || service.serviceStatus === 'فعال'
                          ? 'متاحة'
                          : (service.serviceStatus === 'غير متوفرة' || service.serviceStatus === 'غير متوفره')
                            ? 'غير متوفر حاليا'
                            : service.serviceStatus || 'معطلة'}
                      </span>
                    )}
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black shadow-xs ${
                      (service.adminStatus === 'موقوفة' || service.adminStatus === 'محظورة') ? 'bg-red-650 text-white' : 'bg-slate-800 text-white'
                    }`}>
                      {service.adminStatus || 'فعالة'}
                    </span>
                  </div>

                  {/* Service Image Block */}
                  <div className="h-48 w-full bg-slate-100 relative overflow-hidden shrink-0">
                    {(service as any).videoUrl ? (
                      <video 
                        src={(service as any).videoUrl} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                      />
                    ) : (
                      <img 
                        src={service.image || 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=500&q=60'} 
                        alt={service.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                    <div className="absolute bottom-3 right-3 text-white">
                      <span className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold">
                        {service.category || 'خدمات مساندة'}
                      </span>
                    </div>
                  </div>

                  {/* Details Body */}
                  <div className="p-5 flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h3 className="text-md font-bold text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-1 flex-1">{service.name}</h3>
                        <button 
                          onClick={(e) => openProviderChat(e, service.provider, service.name)}
                          className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 transition-all p-1.5 rounded-lg shrink-0" 
                          title="مراسلة مزود الخدمة"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-slate-400 text-[10px] mb-3 line-clamp-2 leading-relaxed">{service.description || 'لا يوجد وصف متاح للخدمة.'}</p>
                      
                      {/* Provider Credit */}
                      <p className="text-[10px] text-slate-400 flex items-center mb-4">
                        <span className="font-semibold text-slate-600 ml-1">بواسطة:</span> {(!service.showProviderToCustomers && userRole !== 'admin' && userRole !== 'provider') ? 'مزود خدمة معتمد' : service.provider}
                      </p>

                      <div className="grid grid-cols-2 gap-y-2 gap-x-2 text-[11px] text-slate-500 mb-5 pb-5 border-b border-slate-100">
                        <div className="flex items-center gap-1.5 col-span-2">
                          <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate">تغطية النطاق: {service.regions || 'الرياض'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 col-span-2">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>التكلفة الأساسية: <strong className="text-emerald-700 text-xs">{(service.price || 150).toLocaleString('ar-SA')} ر.س</strong> {service.unit ? ` / ${service.unit}` : ''}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-between items-center pt-1 font-sans">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditService(service)}
                          className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
                          title="تعديل باقة الخدمة والأسعار"
                          id={`edit-service-btn-${service.id}`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleTogglePauseService(service.id)}
                          className={`p-2 rounded-xl transition-colors cursor-pointer ${
                            (service.isPaused || service.serviceStatus === 'موقوفة')
                              ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                              : 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                          }`}
                          title={(service.isPaused || service.serviceStatus === 'موقوفة') ? 'استئناف تقديم الخدمة' : 'إيقاف مؤقت للخدمة'}
                        >
                          {(service.isPaused || service.serviceStatus === 'موقوفة') ? (
                            <PlayCircle className="w-4 h-4" />
                          ) : (
                            <PauseCircle className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAuditEntity({ type: 'service', id: service.id, name: service.name });
                            setIsAuditModalOpen(true);
                          }}
                          className="p-2 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors cursor-pointer"
                          title="سجل الإصدارات والتغييرات (Audit Log)"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteService(service.id)}
                          className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors cursor-pointer"
                          title="حذف / أرشفة الخدمة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => navigate('/services')}
                        className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-black text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>رؤية بالدليل العام</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : viewMode === 'list' ? (
            /* Services List View */
            <div className="flex flex-col gap-4">
              {displayedServices.map((service) => (
                <div 
                  key={service.id}
                  className={`bg-white rounded-3xl overflow-hidden border p-5 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col md:flex-row gap-6 relative group ${
                    service.isPaused || service.serviceStatus === 'موقوفة' ? 'border-amber-200 bg-amber-50/20' : 'border-slate-100'
                  }`}
                  id={`service-list-${service.id}`}
                >
                  {/* Status Badges */}
                  <div className="absolute top-4 right-4 z-10 flex flex-wrap gap-1.5 font-sans">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-900/80 backdrop-blur-xs text-indigo-300 border border-indigo-400/30 flex items-center gap-1 shadow-xs">
                      <GitBranch className="w-3 h-3 text-indigo-300" />
                      v{service.version || 1}
                    </span>
                    {(service.isPaused || service.serviceStatus === 'موقوفة') ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black shadow-xs bg-amber-500 text-white flex items-center gap-1">
                        <PauseCircle className="w-3 h-3" />
                        موقوفة مؤقتاً
                      </span>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black shadow-xs ${
                        (service.serviceStatus === 'متاحة' || service.serviceStatus === 'نشط' || service.serviceStatus === 'فعال') 
                          ? 'bg-emerald-500 text-white' 
                          : (service.serviceStatus === 'غير متوفرة' || service.serviceStatus === 'غير متوفره') 
                            ? 'bg-amber-500 text-white' 
                            : 'bg-red-500 text-white'
                      }`}>
                        {service.serviceStatus === 'متاحة' || service.serviceStatus === 'نشط' || service.serviceStatus === 'فعال'
                          ? 'متاحة'
                          : (service.serviceStatus === 'غير متوفرة' || service.serviceStatus === 'غير متوفره')
                            ? 'غير متوفر حاليا'
                            : service.serviceStatus || 'معطلة'}
                      </span>
                    )}
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black shadow-xs ${
                      (service.adminStatus === 'موقوفة' || service.adminStatus === 'محظورة') ? 'bg-red-650 text-white' : 'bg-slate-800 text-white'
                    }`}>
                      {service.adminStatus || 'فعالة'}
                    </span>
                  </div>

                  {/* Image Block */}
                  <div className="w-full md:w-60 h-40 bg-slate-100 rounded-2xl overflow-hidden shrink-0">
                    <img 
                      src={service.image || 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=500&q=60'} 
                      alt={service.name}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform"
                    />
                  </div>

                  {/* Details Details */}
                  <div className="flex-grow flex flex-col justify-between pt-4 md:pt-0">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-black">{service.category || 'خدمات مساندة'}</span>
                        <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-medium">{service.regions || 'الرياض'}</span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <h3 className="text-md font-bold text-slate-800 hover:text-indigo-650 transition-colors flex-1">{service.name}</h3>
                        <button 
                          onClick={(e) => openProviderChat(e, service.provider, service.name)}
                          className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 transition-all p-1.5 rounded-lg shrink-0" 
                          title="مراسلة مزود الخدمة"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-slate-400 text-xs mt-1 line-clamp-2 leading-relaxed">{service.description || 'لا يوجد وصف متاح للخدمة.'}</p>
                      <p className="text-[10px] text-slate-400 mt-1">بواسطة المزود: {(!service.showProviderToCustomers && userRole !== 'admin' && userRole !== 'provider') ? 'مزود خدمة معتمد' : service.provider}</p>

                      <div className="flex flex-wrap gap-4 text-[11px] text-slate-500 mt-4">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-500" />
                          <span>المنطقة: {service.regions || 'كل المناطق'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                          <span>التكلفة الأساسية: <strong className="text-emerald-700 font-bold">{(service.price || 150).toLocaleString('ar-SA')} ر.س</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-1 mt-5 pt-4 border-t border-slate-50 font-sans">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditService(service)}
                          className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
                          title="تعديل"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleTogglePauseService(service.id)}
                          className={`p-2 rounded-xl transition-colors cursor-pointer ${
                            (service.isPaused || service.serviceStatus === 'موقوفة')
                              ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                              : 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                          }`}
                          title={(service.isPaused || service.serviceStatus === 'موقوفة') ? 'استئناف تقديم الخدمة' : 'إيقاف مؤقت للخدمة'}
                        >
                          {(service.isPaused || service.serviceStatus === 'موقوفة') ? (
                            <PlayCircle className="w-4 h-4" />
                          ) : (
                            <PauseCircle className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAuditEntity({ type: 'service', id: service.id, name: service.name });
                            setIsAuditModalOpen(true);
                          }}
                          className="p-2 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors cursor-pointer"
                          title="سجل الإصدارات (Audit Log)"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteService(service.id)}
                          className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors cursor-pointer"
                          title="حذف / أرشفة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => navigate('/services')}
                        className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-black text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>رؤية بالدليل العام</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Services Tabular View With Row limit selector and Paging controls */
            <div className="space-y-4">
              <div className="bg-white rounded-3xl border border-slate-150/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold font-sans">
                        <th className="p-4">اسم باقة الخدمة المساندة</th>
                        <th className="p-4 text-center">الإصدار</th>
                        <th className="p-4">نوع الخدمة</th>
                        <th className="p-4">نطاق التغطية</th>
                        {userRole === 'admin' && <th className="p-4">المزود المسؤول</th>}
                        <th className="p-4">التكلفة الأساسية</th>
                        <th className="p-4 text-center">مستوى التوثيق</th>
                        <th className="p-4 text-center">حالة الخدمة</th>
                        <th className="p-4 text-center">الإجراءات والتحكم</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedServices.map((service) => (
                        <tr key={service.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors font-semibold">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img src={service.image} className="w-10 h-10 object-cover rounded-lg shadow-xs" referrerPolicy="no-referrer" />
                              <span className="font-black text-slate-800">{service.name}</span>
                              <button 
                                onClick={(e) => openProviderChat(e, service.provider, service.name)}
                                className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 transition-all p-1.5 rounded-lg shrink-0 mr-1.5" 
                                title="مراسلة مزود الخدمة"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-900 text-indigo-300">
                              v{service.version || 1}
                            </span>
                          </td>
                          <td className="p-4 text-slate-600">
                            <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">{service.category || 'باقة'}</span>
                          </td>
                          <td className="p-4 text-slate-500 text-[11px]">{service.regions || 'الرياض'}</td>
                          {userRole === 'admin' && <td className="p-4 text-slate-700 font-bold">{service.provider}</td>}
                          <td className="p-4 text-emerald-700 font-bold font-sans">{(service.price || 150).toLocaleString('ar-SA')} ر.س</td>
                          <td className="p-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${service.adminStatus === 'محظورة' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-800'}`}>
                              {service.adminStatus || 'فعالة'}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            {(service.isPaused || service.serviceStatus === 'موقوفة') ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600">
                                ⏸️ موقوفة مؤقتاً
                              </span>
                            ) : (
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${service.serviceStatus === 'نشط' || service.serviceStatus === 'فعال' || service.serviceStatus === 'متاحة' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                {service.serviceStatus === 'نشط' || service.serviceStatus === 'فعال' || service.serviceStatus === 'متاحة' ? 'متاحة' : 'معطلة'}
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex justify-center items-center gap-1.5">
                              <button onClick={() => handleOpenEditService(service)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="تعديل"><Edit3 className="w-4 h-4" /></button>
                              <button 
                                onClick={() => handleTogglePauseService(service.id)} 
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  (service.isPaused || service.serviceStatus === 'موقوفة') ? 'text-emerald-700 hover:bg-emerald-50' : 'text-amber-600 hover:bg-amber-50'
                                }`} 
                                title={(service.isPaused || service.serviceStatus === 'موقوفة') ? 'استئناف تقديم الخدمة' : 'إيقاف مؤقت للخدمة'}
                              >
                                {(service.isPaused || service.serviceStatus === 'موقوفة') ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedAuditEntity({ type: 'service', id: service.id, name: service.name });
                                  setIsAuditModalOpen(true);
                                }} 
                                className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer" 
                                title="سجل الإصدارات (Audit Log)"
                              >
                                <History className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteService(service.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="حذف / أرشفة"><Trash2 className="w-4 h-4" /></button>
                              <button onClick={() => navigate('/services')} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="معاينة"><Eye className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Rows Per Page Dropdown & Tabular Paging Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <span>عدد الأسطر المعروضة:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="p-1.5 rounded-lg border border-slate-200 outline-none focus:border-amber-500 bg-slate-50 text-slate-800"
                  >
                    <option value={10}>10 صفوف</option>
                    <option value={25}>25 صفاً</option>
                    <option value={50}>50 صفاً</option>
                    <option value={100}>100 صف</option>
                  </select>
                </div>

                <div className="flex items-center gap-4 font-sans">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-slate-700">
                    صفحة {currentPage} من {totalServicesPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalServicesPages))}
                    disabled={currentPage === totalServicesPages}
                    className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </main>

      {/* Hall Modal Dialog */}
      {isHallModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div 
            className={`rounded-3xl max-w-4xl w-full h-[95vh] md:h-[630px] flex flex-col justify-between shadow-2xl border animate-in zoom-in-95 duration-200 text-right transition-colors duration-200 overflow-hidden ${
              isDark 
                ? 'bg-slate-900 border-slate-800 text-slate-100' 
                : 'bg-white border-slate-100 text-slate-800'
            }`}
          >
            {/* Modal Header */}
            <div className={`p-6 pb-4 md:px-8 border-b flex items-center justify-between shrink-0 ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/30'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-black flex items-center gap-2">
                    <span className={isDark ? 'text-slate-100' : 'text-slate-900'}>
                      {editingHall ? 'تحديث بيانات القاعة والمنشأة' : 'إضافة قاعة جديدة متميزة'}
                    </span>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${isDark ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                      بوابة النخبة
                    </span>
                  </h2>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    قم بتعبئة وإعداد بيانات منشأتك لتظهر بشكل متميز وفاخر لعملائك ضمن منصة الحجوزات
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMediaGuideTab('guide');
                    setIsMediaGuideOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer border border-emerald-400/30 active:scale-95 shrink-0"
                  title="فتح دليل واشتراطات الوسائط والمعايير الأفقية (16:9)"
                >
                  <Camera className="w-4 h-4 text-emerald-100" />
                  <span>📷 دليل وااشتراطات الوسائط (16:9)</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setIsHallModalOpen(false)}
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Stepper Progress Bar (Desktop vs Mobile) */}
            <div className={`px-6 py-4 md:px-8 border-b shrink-0 ${isDark ? 'border-slate-800 bg-slate-950/20' : 'border-slate-50 bg-slate-50/20'}`}>
              {/* Stepper Grid for Desktop */}
              <div className="hidden md:flex items-center justify-between relative mt-1">
                {/* Connecting gold line */}
                <div className="absolute top-1/2 left-4 right-4 h-[3px] -translate-y-1/2 bg-slate-150 dark:bg-slate-850 z-0 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-300"
                    style={{ width: `${((hallModalStep - 1) / 3) * 100}%` }}
                  />
                </div>

                {[
                  { id: 1, title: 'الهوية والتصنيف', icon: Building2 },
                  { id: 2, title: 'الموقع الجغرافي', icon: MapPin },
                  { id: 3, title: 'الأسعار والتوثيق', icon: Coins },
                  { id: 4, title: 'التجهيزات والصور', icon: Sparkles }
                ].map((step) => {
                  const StepIcon = step.icon;
                  const isActive = hallModalStep === step.id;
                  const isCompleted = hallModalStep > step.id;
                  
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => {
                        // Dynamic validation check before jumping to a higher step
                        if (step.id < hallModalStep) {
                          setHallModalStep(step.id);
                          setFormError('');
                        } else if (step.id > hallModalStep) {
                          // Allow navigation if intermediate steps are validated
                          let validTemp = true;
                          for (let s = hallModalStep; s < step.id; s++) {
                            if (s === 1 && (!hallForm.name || !hallForm.capacity || Number(hallForm.capacity) <= 0)) validTemp = false;
                            if (s === 2 && !hallForm.address) validTemp = false;
                            if (s === 3 && (!hallForm.crNumber || Number(hallForm.nightPrice) <= 0 || Number(hallForm.fullDayPrice) <= 0)) validTemp = false;
                          }
                          if (validTemp) {
                            setHallModalStep(step.id);
                            setFormError('');
                          } else {
                            setFormError('يرجى تعبئة الحقول الأساسية المطلوبة أولاً للانتقال إلى هذه الخطوة');
                          }
                        }
                      }}
                      className="relative z-10 flex flex-col items-center group focus:outline-none"
                    >
                      <div 
                        className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                          isCompleted
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                            : isActive
                              ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20 ring-4 ring-amber-500/10'
                              : isDark
                                ? 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                                : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-5 h-5 font-black" />
                        ) : (
                          <StepIcon className="w-4 h-4" />
                        )}
                      </div>
                      <span 
                        className={`text-[10px] sm:text-xs font-bold mt-2 transition-all duration-200 ${
                          isActive 
                            ? 'text-amber-500 font-extrabold' 
                            : isCompleted 
                              ? 'text-slate-500 dark:text-slate-400' 
                              : 'text-slate-400 dark:text-slate-600'
                        }`}
                      >
                        {step.title}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Mobile Stepper */}
              <div className="flex md:hidden items-center justify-between">
                <span className="text-xs font-black text-amber-500 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  الخطوة {hallModalStep} من 4: {
                    hallModalStep === 1 ? 'الهوية والتصنيف' :
                    hallModalStep === 2 ? 'الموقع الجغرافي والبلدي' :
                    hallModalStep === 3 ? 'سياسات التسعير والتوثيق' : 'التجهيزات والصور'
                  }
                </span>
                <div className="w-24 h-2 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-200"
                    style={{ width: `${(hallModalStep / 4) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            {/* Form Core Body */}
            <form 
              onSubmit={handleSaveHall} 
              className="flex-1 min-h-0 flex flex-col justify-between" 
              id="hall-form-element"
            >
              <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 md:px-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={hallModalStep}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.18 }}
                    className="h-full"
                  >
                    {/* STEP 1: الهوية الأساسية والتصنيف الفني */}
                    {hallModalStep === 1 && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* Name */}
                          <div className="space-y-1 md:col-span-2">
                            <label className={`text-xs font-black flex items-center gap-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                              <span>اسم القاعة / المنشأة</span>
                              <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                required
                                value={hallForm.name}
                                onChange={e => {
                                  setHallForm(prev => ({ ...prev, name: e.target.value }));
                                  setFormError('');
                                }}
                                placeholder="مثال: قاعة ليلة العمر الملكية الكبرى"
                                className={`w-full p-3 pr-10 rounded-xl outline-none transition-all text-sm font-medium ${
                                  isDark 
                                    ? 'bg-slate-950 border border-slate-800 text-white focus:border-amber-400 placeholder-slate-700' 
                                    : 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-amber-500 placeholder-slate-400'
                                }`}
                              />
                              <Building2 className={`w-4 h-4 absolute top-3.5 right-3.5 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                            </div>
                          </div>

                          {/* Category */}
                          <div className="space-y-1">
                            <label className={`text-xs font-black ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>تصنيف المرفق</label>
                            <select
                              value={hallForm.category}
                              onChange={e => setHallForm(prev => ({ ...prev, category: e.target.value }))}
                              className={`w-full p-3 rounded-xl outline-none text-sm cursor-pointer transition-all ${
                                isDark 
                                  ? 'bg-slate-950 border border-slate-800 text-slate-200 focus:border-amber-400' 
                                  : 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-amber-500'
                              }`}
                            >
                              {hallCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>

                          {/* Provider Name (Disabled) */}
                          <div className="space-y-1">
                            <label className={`text-xs font-black ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>اسم مزود الخدمة المسجل</label>
                            <input
                              type="text"
                              disabled
                              value={hallForm.provider}
                              className={`w-full p-3 rounded-xl outline-none text-sm transition-all bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed`}
                            />
                          </div>

                          {/* Toggle: Show Provider Name to Customers */}
                          <div className="pt-1 pb-2">
                            <label className="flex items-center gap-2 font-bold cursor-pointer select-none">
                              <input
                                type="checkbox"
                                id="show_provider_halls_toggle"
                                checked={hallForm.showProvider !== false}
                                onChange={e => setHallForm(prev => ({ ...prev, showProvider: e.target.checked }))}
                                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                              />
                              <span className={`text-xs font-black ${isDark ? 'text-slate-200' : 'text-slate-705'}`}>إظهار اسم المزود للعملاء</span>
                            </label>
                            <p className="text-[10px] text-slate-400 mt-1">
                              (عند التفعيل يسمح بإظهار اسم المزود للعملاء في واجهة العميل، وعند التعطيل يمنع إظهار اسم المزود للعملاء في واجهة العميل)
                            </p>
                          </div>

                          {/* Mobile Number */}
                          <div className="space-y-1">
                            <label className={`text-xs font-black flex items-center gap-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                              <span>رقم جوال تواصل الضيوف والاستفسارات</span>
                              <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="tel"
                                required
                                maxLength={10}
                                value={hallForm.phone}
                                onChange={e => {
                                  setHallForm(prev => ({ ...prev, phone: e.target.value }));
                                  setFormError('');
                                }}
                                placeholder="05xxxxxxxx"
                                className={`w-full p-3 pr-24 pl-10 rounded-xl outline-none transition-all text-sm font-sans tracking-wider ${
                                  isDark 
                                    ? 'bg-slate-955 border border-slate-800 text-white focus:border-amber-400 placeholder-slate-700' 
                                    : 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-amber-500 placeholder-slate-400'
                                }`}
                              />
                              <div className="absolute right-3 top-3 flex items-center gap-1 text-[11px] font-bold text-slate-400">
                                <span className="text-xs">🇸🇦</span>
                                <span>+966</span>
                              </div>
                            </div>
                          </div>

                          {/* Email Address */}
                          <div className="space-y-1">
                            <label className={`text-xs font-black flex items-center gap-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                              <span>البريد الإلكتروني للشكاوى والدعم</span>
                              <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="email"
                                required
                                value={hallForm.email}
                                onChange={e => {
                                  setHallForm(prev => ({ ...prev, email: e.target.value }));
                                  setFormError('');
                                }}
                                placeholder="provider@lylah.com"
                                className={`w-full p-3 pr-10 rounded-xl outline-none transition-all text-sm font-sans placeholder-slate-400 ${
                                  isDark 
                                    ? 'bg-slate-955 border border-slate-800 text-white focus:border-amber-400' 
                                    : 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-amber-500'
                                }`}
                              />
                              <span className={`absolute top-3.5 right-3.5 text-xs text-slate-450`}>✉️</span>
                            </div>
                          </div>

                          {/* About the facility */}
                          <div className="space-y-1 md:col-span-2">
                            <label className={`text-xs font-black ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>نبذة تعريفية ولمحة عامة عن المكان</label>
                            <textarea
                              rows={2}
                              value={hallForm.about}
                              onChange={e => setHallForm(prev => ({ ...prev, about: e.target.value }))}
                              placeholder="أبرز ما يميز الصرح ومجلس الرجال وموقع الفناء وغيرها من الميزات التسويقية الفاخرة..."
                              className={`w-full p-3 rounded-xl outline-none text-xs leading-relaxed resize-none transition-all ${
                                isDark 
                                  ? 'bg-slate-955 border border-slate-800 text-slate-200 focus:border-amber-400 placeholder-slate-700' 
                                  : 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-amber-500 placeholder-slate-400'
                              }`}
                            />
                          </div>

                          {/* Central Operating Status - ADMINS ONLY (Hiddend from Providers) */}
                          {userRole === 'admin' && (
                            <div className="space-y-1">
                              <label className={`text-xs font-black ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>حالة التشغيل المركزي (تحكم الإدارة العام فقط)</label>
                              <select
                                value={hallForm.status}
                                onChange={e => setHallForm(prev => ({ ...prev, status: e.target.value as 'مفعل' | 'معطل' }))}
                                className={`w-full p-3 rounded-xl outline-none text-sm cursor-pointer transition-all ${
                                  isDark 
                                    ? 'bg-slate-955 border border-slate-800 text-slate-200 focus:border-amber-400' 
                                    : 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-amber-500'
                                }`}
                              >
                                <option value="مفعل" className="text-emerald-500 font-bold">منشور ومتاح للزوار والباحثين ●</option>
                                <option value="معطل" className="text-rose-500 font-bold">معطل ومخفي مؤقتاً بالبوابة ●</option>
                              </select>
                            </div>
                          )}

                          {/* Booking Status (Provider controlled) */}
                          <div className="space-y-1">
                            <label className={`text-xs font-black ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>الحالة التشغيلية المباشرة للحجز الشاغر</label>
                            <select
                              value={hallForm.bookingStatus}
                              onChange={e => setHallForm(prev => ({ ...prev, bookingStatus: e.target.value as 'متاح' | 'محجوز' }))}
                              className={`w-full p-3 rounded-xl outline-none text-sm cursor-pointer transition-all ${
                                isDark 
                                  ? 'bg-slate-955 border border-slate-800 text-slate-200 focus:border-amber-400' 
                                  : 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-amber-500'
                              }`}
                            >
                              <option value="متاح">شاغر ومفتوح للتواريخ القادمة بشكل تلقائي</option>
                              <option value="محجوز">محجوز بالكامل أو تحت الصيانة الوقائية مؤقتاً</option>
                            </select>
                          </div>

                        </div>
                      </div>
                    )}

                    {/* STEP 2: الموقع الجغرافي والعناوين التفصيلية */}
                    {hallModalStep === 2 && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* Region */}
                          <div className="space-y-1">
                            <label className={`text-xs font-black ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>المنطقة الإدارية بالسعودية</label>
                            <select
                              value={hallForm.region}
                              onChange={e => setHallForm(prev => ({ 
                                ...prev, 
                                region: e.target.value, 
                                city: SAUDI_REGIONS.find(r => r.name === e.target.value)?.cities[0] || '' 
                              }))}
                              className={`w-full p-3 rounded-xl outline-none text-sm cursor-pointer transition-all ${
                                isDark 
                                  ? 'bg-slate-955 border border-slate-800 text-slate-200 focus:border-amber-400' 
                                  : 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-amber-500'
                              }`}
                            >
                              {SAUDI_REGIONS.map(r => (
                                <option key={r.name} value={r.name}>{r.name}</option>
                              ))}
                            </select>
                          </div>

                          {/* City (with Other custom notification addition trigger) */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center mb-0.5">
                              <label className={`text-xs font-black ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>المدينة</label>
                              <button 
                                type="button"
                                onClick={() => {
                                  setIsCustomCity(!isCustomCity); 
                                  setFormError('');
                                }}
                                className="text-[10px] font-black text-amber-500 hover:underline"
                              >
                                {isCustomCity ? '← العودة للقائمة الجاهزة' : '+ إضافة مدينة غير موجودة'}
                              </button>
                            </div>
                            
                            {isCustomCity ? (
                              <div className="relative">
                                <input
                                  type="text"
                                  value={customCityName}
                                  onChange={e => {
                                    setCustomCityName(e.target.value);
                                    setFormError('');
                                  }}
                                  placeholder="اكتب اسم مدينتك الجديدة لإرسالها للإدارة"
                                  className={`w-full p-3 pr-10 rounded-xl outline-none transition-all text-sm ${
                                    isDark 
                                      ? 'bg-slate-955 border border-slate-800 text-white focus:border-amber-400 placeholder-slate-700' 
                                      : 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-amber-500 placeholder-slate-400'
                                  }`}
                                />
                                <span className="absolute top-3.5 right-3.5 text-xs">🏙️</span>
                              </div>
                            ) : (
                              <select
                                value={hallForm.city}
                                onChange={e => setHallForm(prev => ({ ...prev, city: e.target.value }))}
                                className={`w-full p-3 rounded-xl outline-none text-sm cursor-pointer transition-all ${
                                  isDark 
                                    ? 'bg-slate-955 border border-slate-800 text-slate-200 focus:border-amber-400' 
                                    : 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-amber-500'
                                }`}
                              >
                                {formCities.map(city => (
                                  <option key={city} value={city}>{city}</option>
                                ))}
                              </select>
                            )}
                          </div>

                          {/* National Address linked to GoogleMapsModal */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center mb-0.5">
                              <label className={`text-xs font-black ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>العنوان الوطني الكلي</label>
                              <button 
                                type="button" 
                                onClick={() => setIsMapsOpen(true)}
                                className="text-[9px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-lg font-black transition-all cursor-pointer flex items-center gap-1"
                              >
                                🗺️ تحديد من خريطة قوقل
                              </button>
                            </div>
                            <div className="relative">
                              <input
                                type="text"
                                required
                                value={hallForm.nationalAddress || ''}
                                onChange={e => {
                                  const val = e.target.value;
                                  setHallForm(prev => ({ ...prev, nationalAddress: val, address: val }));
                                  setFormError('');
                                }}
                                placeholder="رمز العنوان الوطني مثل: SH-2401-2394 أو اختر الخريطة"
                                className={`w-full p-3 pr-10 rounded-xl outline-none transition-all text-sm ${
                                  isDark 
                                    ? 'bg-slate-955 border border-slate-800 text-white focus:border-amber-400 placeholder-slate-700' 
                                    : 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-amber-500 placeholder-slate-400'
                                }`}
                              />
                              <FileCheck className={`w-4 h-4 absolute top-3.5 right-3.5 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                            </div>
                          </div>

                          {/* Extra geographic details */}
                          <div className="space-y-1 md:col-span-2">
                            <label className={`text-xs font-black ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>تفاصيل إضافية للموقع وعلامات الدلالة القريبة</label>
                            <input
                              type="text"
                              value={hallForm.extraAddress || ''}
                              onChange={e => setHallForm(prev => ({ ...prev, extraAddress: e.target.value }))}
                              placeholder="مثال: بجوار مستشفى دله - مخرج ٩ - أمام حديقة البلدية"
                              className={`w-full p-3 rounded-xl outline-none transition-all text-sm ${
                                isDark 
                                  ? 'bg-slate-955 border border-slate-800 text-white focus:border-amber-400 placeholder-slate-700' 
                                  : 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-amber-500 placeholder-slate-400'
                              }`}
                            />
                          </div>

                        </div>

                        {/* Interactive Google maps background modal picker trigger */}
                        <GoogleMapsModal
                          isOpen={isMapsOpen}
                          onClose={() => setIsMapsOpen(false)}
                          onConfirm={(addressVal, location, extra) => {
                            setHallForm(prev => ({
                              ...prev,
                              nationalAddress: addressVal,
                              address: addressVal,
                              ...(extra && extra.region && extra.city ? { region: extra.region, city: extra.city } : {})
                            }));
                            setIsMapsOpen(false);
                            setFormError('');
                          }}
                          initialAddress={hallForm.address || 'Saudi Arabia'}
                        />
                      </div>
                    )}

                    {/* STEP 3: سياسات التسعير والتوثيق والتحقق التنظيمي */}
                    {hallModalStep === 3 && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* Business Entity Type selector */}
                          <div className="space-y-1">
                            <label className={`text-xs font-black ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>نوع الكيان القانوني لمزود الخدمة</label>
                            <select
                              value={hallForm.providerType}
                              onChange={e => setHallForm(prev => ({ ...prev, providerType: e.target.value as 'منشأة' | 'فرد' }))}
                              className={`w-full p-3 rounded-xl outline-none text-sm cursor-pointer transition-all ${
                                isDark 
                                  ? 'bg-slate-955 border border-slate-800 text-slate-200 focus:border-amber-400' 
                                  : 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-amber-500'
                              }`}
                            >
                              <option value="منشأة">منشأة تجارية تجارية (شركة، مؤسسة)</option>
                              <option value="فرد">فرد مستقل وثيقة ثبوتية (هوية وطنية، رخصة العمل الحر)</option>
                            </select>
                          </div>

                          {/* ID or CR digits */}
                          <div className="space-y-1">
                            <label className={`text-xs font-black flex items-center gap-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                              <span>
                                {hallForm.providerType === 'منشأة' 
                                  ? 'رقم السجل التجاري' 
                                  : 'رقم الهوية الوطنية'}
                              </span>
                              <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                required
                                value={hallForm.crNumber}
                                onChange={e => {
                                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                  setHallForm(prev => ({ ...prev, crNumber: val }));
                                  setFormError('');
                                }}
                                placeholder={hallForm.providerType === 'منشأة' ? 'يتكون من 10 أرقام تماماً' : 'يتكون من 10 أرقام تماماً ويبدأ بـ 1 أو 2'}
                                className={`w-full p-3 pr-10 rounded-xl outline-none transition-all text-sm ${
                                  isDark 
                                    ? 'bg-slate-955 border border-slate-800 text-white focus:border-amber-400 placeholder-slate-700' 
                                    : 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-amber-500 placeholder-slate-400'
                                }`}
                              />
                              <ShieldCheck className={`w-4 h-4 absolute top-3.5 right-3.5 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                            </div>
                          </div>

                          {/* CR Expiry Date */}
                          <div className="space-y-1">
                            <label className={`text-xs font-black flex items-center gap-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                              <span>تاريخ انتهاء السجل / تاريخ انتهاء الوثيقة</span>
                              <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="date"
                                required
                                value={hallForm.crExpiryDate}
                                onChange={e => setHallForm(prev => ({ ...prev, crExpiryDate: e.target.value }))}
                                className={`w-full p-3 rounded-xl outline-none transition-all text-sm ${
                                  isDark 
                                    ? 'bg-slate-955 border border-slate-800 text-white focus:border-amber-400' 
                                    : 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-amber-500'
                                }`}
                              />
                            </div>
                          </div>

                          {/* VAT exemption check */}
                          <div className="space-y-1 flex flex-col justify-end">
                            <label className={`relative flex items-center gap-2.5 p-3 rounded-xl border border-dashed transition-colors cursor-pointer ${
                              !hallForm.isVatExempt 
                                ? 'border-amber-500/40 bg-amber-500/5' 
                                : isDark ? 'border-slate-800' : 'border-slate-200 hover:bg-slate-50/50'
                            }`}>
                              <input
                                type="checkbox"
                                checked={!hallForm.isVatExempt}
                                onChange={e => setHallForm(prev => ({ 
                                  ...prev, 
                                  isVatExempt: !e.target.checked,
                                  taxNumber: !e.target.checked ? '' : prev.taxNumber 
                                }))}
                                className="rounded text-amber-500 border-slate-350 focus:ring-amber-500"
                              />
                              <div className="font-sans">
                                <span className={`text-xs block font-black ${isDark ? 'text-slate-205' : 'text-slate-700'}`}>خاضع لضريبة القيمة المضافة (غير معفى)</span>
                                <span className="text-[9px] text-slate-400">عند تفعيلها، سيتم تمثيل الرقم الضريبي بالفواتير الصادرة للعميل</span>
                              </div>
                            </label>
                          </div>

                          {/* Tax number if shown */}
                          {!hallForm.isVatExempt && (
                            <div className="space-y-1 md:col-span-2">
                              <label className={`text-xs font-black flex items-center gap-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                                <span>الرقم الضريبي الموحد للمنشأة (VAT Number)</span>
                                <span className="text-rose-500">*</span>
                              </label>
                              <div className="relative font-mono">
                                <input
                                  type="text"
                                  required
                                  value={hallForm.taxNumber}
                                  onChange={e => setHallForm(prev => ({ ...prev, taxNumber: e.target.value }))}
                                  placeholder="الرقم الضريبي المعتمد المكون من ١٥ خانة يبدأ بالرقم ٣"
                                  className={`w-full p-3 pr-10 rounded-xl outline-none transition-all text-sm ${
                                    isDark 
                                      ? 'bg-slate-955 border border-slate-800 text-white focus:border-amber-400' 
                                      : 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-amber-500'
                                  }`}
                                />
                                <span className="absolute top-3.5 right-3.5 text-xs text-slate-450">🧾</span>
                              </div>
                            </div>
                          )}

                          {/* Security deposit amount */}
                          <div className="space-y-1">
                            <label className={`text-xs font-black ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>مبلغ التأمين المسترد لحماية المنشأة (ر.س)</label>
                            <div className="relative font-mono">
                              <input
                                type="number"
                                min={0}
                                value={hallForm.securityDeposit}
                                onChange={e => setHallForm(prev => ({ ...prev, securityDeposit: parseInt(e.target.value) || 0 }))}
                                className={`w-full p-3 pr-10 rounded-xl outline-none transition-all text-sm font-bold ${
                                  isDark 
                                    ? 'bg-slate-955 border border-slate-800 text-white focus:border-amber-400' 
                                    : 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-amber-500'
                                }`}
                              />
                              <ShieldCheck className={`w-4 h-4 absolute top-3.5 right-3.5 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                              <span className="absolute left-3.5 top-3.5 text-[9px] font-bold text-slate-500">مسترد</span>
                            </div>
                          </div>

                          {/* Cancellation duration */}
                          <div className="space-y-1">
                            <label className={`text-xs font-black ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>الحد الأدنى لفترة الاسترجاع المجاني (بالأيام)</label>
                            <div className="relative font-sans">
                              <input
                                type="number"
                                min={0}
                                value={hallForm.cancellationPeriod}
                                onChange={e => setHallForm(prev => ({ ...prev, cancellationPeriod: parseInt(e.target.value) || 0 }))}
                                className={`w-full p-3 pr-10 rounded-xl outline-none text-sm font-bold ${
                                  isDark 
                                    ? 'bg-slate-955 border border-slate-800 text-white focus:border-amber-400' 
                                    : 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-amber-500'
                                }`}
                              />
                              <Calendar className={`w-4 h-4 absolute top-3.5 right-3.5 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                              <span className="absolute left-3.5 top-3.5 text-[10px] font-bold text-slate-500">أيام قبل الحجز</span>
                            </div>
                          </div>

                          {/* Morning Price */}
                          <div className="space-y-1">
                            <label className={`text-xs font-black ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>سعر الفترة الصباحية (ر.س)</label>
                            <div className="relative font-mono">
                              <input
                                type="number"
                                min={0}
                                value={hallForm.morningPrice}
                                onChange={e => setHallForm(prev => ({ ...prev, morningPrice: parseInt(e.target.value) || 0 }))}
                                className={`w-full p-3 pr-10 rounded-xl outline-none transition-all text-sm font-bold ${
                                  isDark 
                                    ? 'bg-slate-955 border border-slate-800 text-white focus:border-amber-400' 
                                    : 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-amber-500'
                                }`}
                              />
                              <Clock className={`w-4 h-4 absolute top-3.5 right-3.5 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                              <span className="absolute left-3.5 top-3.5 text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded">ر.س</span>
                            </div>
                          </div>

                          {/* Night Price */}
                          <div className="space-y-1">
                            <label className={`text-xs font-black flex items-center gap-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                              <span>سعر الفترة المسائية الأساسية (ر.س)</span>
                              <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative font-mono">
                              <input
                                type="number"
                                min={1}
                                required
                                value={hallForm.nightPrice}
                                onChange={e => {
                                  setHallForm(prev => ({ ...prev, nightPrice: parseInt(e.target.value) || 0 }));
                                  setFormError('');
                                }}
                                className={`w-full p-3 pr-10 rounded-xl outline-none transition-all text-sm font-bold ${
                                  isDark 
                                    ? 'bg-slate-955 border border-slate-800 text-white focus:border-amber-400' 
                                    : 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-amber-500'
                                }`}
                              />
                              <Clock className={`w-4 h-4 absolute top-3.5 right-3.5 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                              <span className="absolute left-3.5 top-3.5 text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded">ر.س</span>
                            </div>
                          </div>

                          {/* Full Day Price */}
                          <div className="space-y-1">
                            <label className={`text-xs font-black flex items-center gap-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                              <span>سعر اليوم الكامل (الترويجي المفتوح) (ر.س)</span>
                              <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative font-mono">
                              <input
                                type="number"
                                min={1}
                                required
                                value={hallForm.fullDayPrice}
                                onChange={e => {
                                  setHallForm(prev => ({ ...prev, fullDayPrice: parseInt(e.target.value) || 0 }));
                                  setFormError('');
                                }}
                                className={`w-full p-3 pr-10 rounded-xl outline-none transition-all text-sm font-bold ${
                                  isDark 
                                    ? 'bg-slate-955 border border-slate-800 text-white focus:border-amber-400' 
                                    : 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-amber-500'
                                }`}
                              />
                              <Coins className={`w-4 h-4 absolute top-3.5 right-3.5 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                              <span className="absolute left-3.5 top-3.5 text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded">ر.س</span>
                            </div>
                          </div>

                          {/* Booking Strategy Selector */}
                          <div className="md:col-span-2 border-t border-slate-100 dark:border-slate-800 pt-5 mt-3 space-y-4 font-sans">
                            <h4 className="text-xs font-black text-amber-500">استراتيجية الحجز وباقات الخدمات</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <label className={`flex flex-col p-4 rounded-2xl border cursor-pointer transition-all ${
                                hallForm.bookingType === 'alacarte' 
                                  ? 'border-amber-500 bg-amber-500/5 shadow-sm shadow-amber-500/5' 
                                  : isDark ? 'border-slate-800 hover:border-slate-700 bg-slate-950/20' : 'border-slate-200 hover:border-slate-300 bg-white shadow-sm'
                              }`}>
                                <div className="flex items-center gap-2 mb-1.5">
                                  <input 
                                    type="radio" 
                                    name="bookingType" 
                                    value="alacarte" 
                                    checked={hallForm.bookingType === 'alacarte'}
                                    onChange={() => setHallForm(prev => ({ ...prev, bookingType: 'alacarte' }))}
                                    className="text-amber-500 border-slate-300 focus:ring-amber-500 h-4 w-4 cursor-pointer"
                                  />
                                  <span className="font-extrabold text-sm text-blue-950 dark:text-amber-100">خدمات منفردة (A La Carte)</span>
                                </div>
                                <span className="text-[10.5px] text-slate-500 leading-relaxed">يتم حجز القاعة بسعرها الأساسي ويختار العميل الخدمات الإضافية منفردة لتضاف للفاتورة حسب احتياجه.</span>
                              </label>

                              <label className={`flex flex-col p-4 rounded-2xl border cursor-pointer transition-all ${
                                hallForm.bookingType === 'packages' 
                                  ? 'border-amber-500 bg-amber-500/5 shadow-sm shadow-amber-500/5' 
                                  : isDark ? 'border-slate-800 hover:border-slate-700 bg-slate-950/20' : 'border-slate-200 hover:border-slate-300 bg-white shadow-sm'
                              }`}>
                                <div className="flex items-center gap-2 mb-1.5">
                                  <input 
                                    type="radio" 
                                    name="bookingType" 
                                    value="packages" 
                                    checked={hallForm.bookingType === 'packages'}
                                    onChange={() => setHallForm(prev => ({ ...prev, bookingType: 'packages' }))}
                                    className="text-amber-500 border-slate-300 focus:ring-amber-500 h-4 w-4 cursor-pointer"
                                  />
                                  <span className="font-extrabold text-sm text-blue-950 dark:text-amber-100">باقات مغلقة (Packages-based)</span>
                                </div>
                                <span className="text-[10.5px] text-slate-500 leading-relaxed">يقوم المزود بإنشاء باقات مسبقة التحديد تشمل القاعة وخدمات مساندة محددة بأسعار مغلقة ومنافسة.</span>
                              </label>

                              <label className={`flex flex-col p-4 rounded-2xl border cursor-pointer transition-all ${
                                hallForm.bookingType === 'venueonly' 
                                  ? 'border-amber-500 bg-amber-500/5 shadow-sm shadow-amber-500/5' 
                                  : isDark ? 'border-slate-800 hover:border-slate-700 bg-slate-950/20' : 'border-slate-200 hover:border-slate-300 bg-white shadow-sm'
                              }`}>
                                <div className="flex items-center gap-2 mb-1.5">
                                  <input 
                                    type="radio" 
                                    name="bookingType" 
                                    value="venueonly" 
                                    checked={hallForm.bookingType === 'venueonly'}
                                    onChange={() => setHallForm(prev => ({ ...prev, bookingType: 'venueonly' }))}
                                    className="text-amber-500 border-slate-300 focus:ring-amber-500 h-4 w-4 cursor-pointer"
                                  />
                                  <span className="font-extrabold text-sm text-blue-950 dark:text-amber-100">قاعة مجردة (Venue Only)</span>
                                </div>
                                <span className="text-[10.5px] text-slate-500 leading-relaxed">حجز القاعة كمنشأة أو مساحة جغرافية مجردة، دون تقديم أو إمكانية إضافة أي خدمات مساندة معها مطلقاً.</span>
                              </label>
                            </div>

                            {/* Predefined Packages Builder if 'packages' strategy selected */}
                            {hallForm.bookingType === 'packages' && (
                              <div className="border border-amber-500/20 bg-amber-500/[0.02] p-5 rounded-2xl space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div>
                                    <h5 className="text-xs font-black text-amber-500 flex items-center gap-1.5">
                                      <span>🛠️ منشئ الباقات المرن (Package Builder)</span>
                                    </h5>
                                    <p className="text-[10px] text-slate-400 mt-0.5">صمم باقات الخدمات المدمجة التي تقدمها هذه القاعة مع الأسعار والخدمات المدمجة</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingPkgId(null);
                                      setPkgName('باقة الفخامة المتكاملة');
                                      setPkgPrice('15000');
                                      setPkgDesc('');
                                      setPkgMorningPrice('');
                                      setPkgNightPrice('');
                                      setPkgFullDayPrice('');
                                      setPkgIsPopular(false);
                                      setIsPkgModalOpen(true);
                                    }}
                                    className="px-4 py-2 text-[11px] font-black bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/5 self-end cursor-pointer"
                                  >
                                    <span>➕ إضافة باقة مخصصة</span>
                                  </button>
                                </div>

                                {(hallForm.packagesList || []).length > 0 ? (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
                                    {(hallForm.packagesList || []).map((pkg: any, idx: number) => (
                                      <div key={pkg.id || idx} className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${isDark ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-100 shadow-sm hover:border-slate-300'}`}>
                                        <div>
                                          <div className="flex items-center justify-between gap-2 mb-1.5">
                                            <div className="flex items-center gap-1.5">
                                              <span className="font-extrabold text-sm text-blue-950 dark:text-amber-300">{pkg.name}</span>
                                              {pkg.isPopular && (
                                                <span className="text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full shrink-0">⭐ الأكثر طلباً</span>
                                              )}
                                            </div>
                                            <span className="text-xs font-bold text-emerald-500 px-2 py-0.5 rounded-lg bg-emerald-500/10 shrink-0">{pkg.price} ر.س</span>
                                          </div>
                                          <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed mb-2 line-clamp-2">{pkg.desc}</p>
                                          
                                          {(pkg.morningPrice || pkg.nightPrice || pkg.fullDayPrice) ? (
                                            <div className="mt-2 pt-2 border-t border-dashed border-slate-100 dark:border-slate-800/40 grid grid-cols-3 gap-1 text-[10px] text-slate-400">
                                              <div>صباحي: <span className="font-bold text-blue-950 dark:text-amber-400">{pkg.morningPrice || '-'}</span></div>
                                              <div>مسائي: <span className="font-bold text-blue-950 dark:text-amber-400">{pkg.nightPrice || '-'}</span></div>
                                              <div>يوم كامل: <span className="font-bold text-blue-950 dark:text-amber-400">{pkg.fullDayPrice || '-'}</span></div>
                                            </div>
                                          ) : null}
                                        </div>
                                        <div className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800/60 pt-2.5 mt-3">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingPkgId(pkg.id);
                                              setPkgName(pkg.name || '');
                                              setPkgPrice(pkg.price ? pkg.price.toString() : '');
                                              setPkgDesc(pkg.desc || '');
                                              setPkgMorningPrice(pkg.morningPrice ? pkg.morningPrice.toString() : '');
                                              setPkgNightPrice(pkg.nightPrice ? pkg.nightPrice.toString() : '');
                                              setPkgFullDayPrice(pkg.fullDayPrice ? pkg.fullDayPrice.toString() : '');
                                              setPkgIsPopular(!!pkg.isPopular);
                                              setIsPkgModalOpen(true);
                                            }}
                                            className="text-[10px] font-bold text-amber-500 hover:underline cursor-pointer"
                                          >
                                            تعديل الباقة
                                          </button>
                                          <span className="text-slate-300 dark:text-slate-700">|</span>
                                          <button
                                            type="button"
                                            onClick={() => handleDuplicatePackage(pkg)}
                                            className="text-[10px] font-bold text-blue-500 hover:underline cursor-pointer"
                                          >
                                            نسخ مكرر
                                          </button>
                                          <span className="text-slate-300 dark:text-slate-700">|</span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (confirm('هل أنت متأكد من حذف هذه الباقة؟')) {
                                                setHallForm(prev => ({
                                                  ...prev,
                                                  packagesList: (prev.packagesList || []).filter(p => p.id !== pkg.id)
                                                }));
                                              }
                                            }}
                                            className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
                                          >
                                            إلغاء وحذف
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/5">
                                    <p className="text-xs text-slate-400">لا توجد باقات خدمات مدمجة مدخلة حالياً لهذه القاعة. اضغط على الزر أعلاه لتصميم أول باقة.</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Dynamic Pricing / Weekend Pricing (Subscription Locked overlay check) - Three Fields */}
                          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl bg-amber-500/[0.02]">
                            
                            {/* Weekend Morning Price */}
                            <div className="space-y-1">
                              <label className={`text-[11px] font-black flex items-center gap-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                                <span>عطلة نهاية الأسبوع - الصباحية (ر.س)</span>
                              </label>
                              {hasDynamicPricing ? (
                                <div className="relative font-mono">
                                  <input
                                    type="number"
                                    min={0}
                                    value={hallForm.weekendMorningPrice}
                                    onChange={e => setHallForm(prev => ({ ...prev, weekendMorningPrice: parseInt(e.target.value) || 0 }))}
                                    className={`w-full p-3 pr-10 rounded-xl outline-none transition-all text-sm font-bold ${
                                      isDark 
                                        ? 'bg-slate-955 border border-slate-800 text-white focus:border-amber-400' 
                                        : 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-amber-500'
                                    }`}
                                  />
                                  <Sparkles className="w-3.5 h-3.5 text-amber-500 absolute top-3.5 right-3.5" />
                                  <span className="absolute left-3.5 top-3.5 text-[8px] font-bold text-amber-600 bg-amber-500/10 px-1 py-0.5 rounded">👑</span>
                                </div>
                              ) : (
                                <div className="relative group">
                                  <input
                                    type="text"
                                    disabled
                                    value="غير متوفر"
                                    className="w-full p-3 pr-8 rounded-xl outline-none text-xs bg-amber-500/5 text-amber-700 border border-amber-500/10 font-bold cursor-not-allowed"
                                  />
                                  <svg className="w-3.5 h-3.5 text-amber-500 absolute top-3.5 right-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>

                            {/* Weekend Night Price */}
                            <div className="space-y-1">
                              <label className={`text-[11px] font-black flex items-center gap-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                                <span>عطلة نهاية الأسبوع - المسائية (ر.س)</span>
                              </label>
                              {hasDynamicPricing ? (
                                <div className="relative font-mono">
                                  <input
                                    type="number"
                                    min={0}
                                    value={hallForm.weekendNightPrice}
                                    onChange={e => setHallForm(prev => ({ ...prev, weekendNightPrice: parseInt(e.target.value) || 0 }))}
                                    className={`w-full p-3 pr-10 rounded-xl outline-none transition-all text-sm font-bold ${
                                      isDark 
                                        ? 'bg-slate-955 border border-slate-800 text-white focus:border-amber-400' 
                                        : 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-amber-500'
                                    }`}
                                  />
                                  <Sparkles className="w-3.5 h-3.5 text-amber-500 absolute top-3.5 right-3.5" />
                                  <span className="absolute left-3.5 top-3.5 text-[8px] font-bold text-amber-600 bg-amber-500/10 px-1 py-0.5 rounded">👑</span>
                                </div>
                              ) : (
                                <div className="relative group">
                                  <input
                                    type="text"
                                    disabled
                                    value="غير متوفر"
                                    className="w-full p-3 pr-8 rounded-xl outline-none text-xs bg-amber-500/5 text-amber-700 border border-amber-500/10 font-bold cursor-not-allowed"
                                  />
                                  <svg className="w-3.5 h-3.5 text-amber-500 absolute top-3.5 right-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>

                            {/* Weekend Full Day Price */}
                            <div className="space-y-1">
                              <label className={`text-[11px] font-black flex items-center gap-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                                <span>عطلة نهاية الأسبوع - اليوم الكامل (ر.س)</span>
                              </label>
                              {hasDynamicPricing ? (
                                <div className="relative font-mono">
                                  <input
                                    type="number"
                                    min={0}
                                    value={hallForm.weekendFullDayPrice}
                                    onChange={e => setHallForm(prev => ({ ...prev, weekendFullDayPrice: parseInt(e.target.value) || 0 }))}
                                    className={`w-full p-3 pr-10 rounded-xl outline-none transition-all text-sm font-bold ${
                                      isDark 
                                        ? 'bg-slate-955 border border-slate-800 text-white focus:border-amber-400' 
                                        : 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-amber-500'
                                    }`}
                                  />
                                  <Sparkles className="w-3.5 h-3.5 text-amber-500 absolute top-3.5 right-3.5" />
                                  <span className="absolute left-3.5 top-3.5 text-[8px] font-bold text-amber-600 bg-amber-500/10 px-1 py-0.5 rounded">👑</span>
                                </div>
                              ) : (
                                <div className="relative group">
                                  <input
                                    type="text"
                                    disabled
                                    value="غير متوفر"
                                    className="w-full p-3 pr-8 rounded-xl outline-none text-xs bg-amber-500/5 text-amber-700 border border-amber-500/10 font-bold cursor-not-allowed"
                                  />
                                  <svg className="w-3.5 h-3.5 text-amber-500 absolute top-3.5 right-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>

                            {!hasDynamicPricing && (
                              <div className="md:col-span-3 text-[10px] text-amber-600 font-bold mt-1 text-center bg-amber-50 dark:bg-amber-950/20 p-2 rounded-xl border border-amber-200/40">
                                🔒 تتطلب ميزة ذكاء التسعير الديناميكي والمواسم تفعيل الباقة المهنية لمضاعفة الارتباط التلقائي بالأرباح والمواسم.
                              </div>
                            )}

                          </div>

                        </div>
                      </div>
                    )}

                    {/* STEP 4: التجهيزات والظهور المرئي (تصميم مقسم side-by-side لعدم التمرير) */}
                    {hallModalStep === 4 && (
                      <div className="flex flex-col lg:flex-row gap-5">
                        
                        {/* النص الأيمن: التجهيزات والشروط والدفع والخدمات الإضافية */}
                        <div className="flex-1 space-y-4">
                          
                          {/* Facilities */}
                          <div className="space-y-1">
                            <label className={`text-xs font-black flex items-center gap-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                              <AlignLeft className="w-3.5 h-3.5 text-amber-500" />
                              <span>المرافق والتجهيزات (مفصولة بفاصلة)</span>
                            </label>
                            <textarea
                              rows={2}
                              value={hallForm.facilities}
                              onChange={e => setHallForm(prev => ({ ...prev, facilities: e.target.value }))}
                              placeholder="مثال: بوفيه مفتوح، كوشة عرس ملكية، مكيفات مركزية، مواقف سيارات خاصة"
                              className={`w-full p-2.5 rounded-xl outline-none text-xs leading-relaxed resize-none transition-all ${
                                isDark 
                                  ? 'bg-slate-955 border border-slate-800 text-slate-200 focus:border-amber-400 placeholder-slate-700' 
                                  : 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-amber-500 placeholder-slate-400'
                              }`}
                            />
                          </div>

                          {/* Place Rules */}
                          <div className="space-y-1">
                            <label className={`text-xs font-black flex items-center gap-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                              <span>قواعد المكان والالتزامات</span>
                            </label>
                            <textarea
                              rows={1}
                              value={hallForm.rules}
                              onChange={e => setHallForm(prev => ({ ...prev, rules: e.target.value }))}
                              placeholder="مثال: يمنع من الطباخين إشعال اللهب داخل الصالات، الالتزام بالبساط الخارجي للألعاب النارية"
                              className={`w-full p-2.5 rounded-xl outline-none text-xs leading-relaxed resize-none transition-all ${
                                isDark 
                                  ? 'bg-slate-955 border border-slate-800 text-slate-200 focus:border-amber-400 placeholder-slate-700' 
                                  : 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-amber-500 placeholder-slate-400'
                              }`}
                            />
                          </div>

                          {/* Contract Terms */}
                          <div className="space-y-1">
                            <label className={`text-xs font-black flex items-center gap-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                              <Info className="w-3.5 h-3.5 text-amber-500" />
                              <span>شروط العقد وتفاصيل عربون الحجز</span>
                            </label>
                            <textarea
                              rows={1}
                              value={hallForm.contractTerms}
                              onChange={e => setHallForm(prev => ({ ...prev, contractTerms: e.target.value }))}
                              placeholder="مثال: يعتبر العربون غير مسترد بعد مرور ٢٤ ساعة على الحجز والاتصال لتأكيد موعد القائمه"
                              className={`w-full p-2.5 rounded-xl outline-none text-xs leading-relaxed resize-none transition-all ${
                                isDark 
                                  ? 'bg-slate-955 border border-slate-800 text-slate-200 focus:border-amber-400 placeholder-slate-700' 
                                  : 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-amber-500 placeholder-slate-400'
                              }`}
                            />
                          </div>

                          {/* Public Payment Gateways Checkbox tags */}
                          <div className="space-y-1.5">
                            <label className={`text-xs font-black block ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>قنوات وطرق الدفع المقبولة لعملائك (المتاحة من إشراف المنصة)</label>
                            <div className="flex flex-wrap gap-2">
                              {administrativePaymentMethods.map(method => {
                                const isSelected = hallForm.paymentMethods.includes(method.key);
                                return (
                                  <button
                                    key={method.key}
                                    type="button"
                                    onClick={() => {
                                      const updated = isSelected 
                                        ? hallForm.paymentMethods.filter(m => m !== method.key)
                                        : [...hallForm.paymentMethods, method.key];
                                      setHallForm(prev => ({ ...prev, paymentMethods: updated }));
                                    }}
                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all border flex items-center gap-1 cursor-pointer ${
                                      isSelected
                                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600'
                                        : isDark 
                                          ? 'bg-slate-955 border-slate-850 hover:border-slate-700 text-slate-400' 
                                          : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-600'
                                    }`}
                                  >
                                    <span>{method.name}</span>
                                    {isSelected && <Check className="w-3 h-3 text-emerald-500" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Extra Services Option sub-wizard */}
                          <div className="space-y-1.5 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-150/40 dark:border-slate-850">
                            <span className="text-[11px] font-black block text-slate-700 dark:text-slate-200">الخدمات الإضافية التابعة للمنشأة المحددة للعميل (اختياري)</span>
                            <div className="flex gap-2 mt-1.5">
                              <input
                                type="text"
                                id="extra-srv-name"
                                placeholder="اسم الخدمة: ضيافة قهوة، كوشا..."
                                className={`flex-1 p-2 rounded-xl text-xs outline-none ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'}`}
                              />
                              <input
                                type="number"
                                id="extra-srv-price"
                                placeholder="السعر"
                                className={`w-16 p-2 rounded-xl text-xs text-center font-mono outline-none ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'}`}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const nameEl = document.getElementById('extra-srv-name') as HTMLInputElement;
                                  const priceEl = document.getElementById('extra-srv-price') as HTMLInputElement;
                                  if (nameEl && priceEl && nameEl.value.trim()) {
                                    const newSrv = {
                                      id: 'extra_' + Date.now().toString(),
                                      name: nameEl.value.trim(),
                                      price: parseInt(priceEl.value) || 0
                                    };
                                    setHallForm(prev => ({
                                      ...prev,
                                      extraServicesList: [...prev.extraServicesList, newSrv]
                                    }));
                                    nameEl.value = '';
                                    priceEl.value = '';
                                  }
                                }}
                                className="px-3 bg-amber-500 hover:bg-amber-600 font-extrabold text-xs text-slate-900 rounded-xl cursor-pointer"
                              >
                                إضافة
                              </button>
                            </div>
                            
                            {hallForm.extraServicesList.length > 0 && (
                              <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
                                {hallForm.extraServicesList.map((srv: any) => (
                                  <div key={srv.id} className="flex justify-between items-center text-[10px] p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <span className="font-extrabold text-slate-700 dark:text-slate-300">{srv.name} ({(srv.price || 0).toLocaleString('ar-SA')} ر.س)</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setHallForm(prev => ({
                                          ...prev,
                                          extraServicesList: prev.extraServicesList.filter((s: any) => s.id !== srv.id)
                                        }));
                                      }}
                                      className="text-rose-500 hover:text-rose-600 font-black cursor-pointer"
                                    >
                                      حذف
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                        </div>

                        {/* العمود الأيسر: رفع المستندات وصور الصرح وصندوق التعهد بسلامة المرفقات */}
                        <div className="w-full lg:w-[350px] space-y-4 shrink-0 overflow-y-auto">
                          
                          {/* Legal Documents section row side-by-side */}
                          <div className="space-y-1.5 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-150/40 dark:border-slate-850">
                            <span className="text-[11px] font-black block text-slate-700 dark:text-slate-200">الوثائق الثبوتية وصور المستندات القانونية</span>
                            <div className="flex flex-col sm:flex-row gap-2 mt-2">
                              <SingleDocUploader
                                label="السجل التجاري/الهوية"
                                value={hallForm.crImage}
                                onChange={(url) => setHallForm(prev => ({ ...prev, crImage: url }))}
                                isDark={isDark}
                                uploadType="hall_document"
                              />
                              {!hallForm.isVatExempt && (
                                <SingleDocUploader
                                  label="الشهادة الضريبية"
                                  value={hallForm.vatImage}
                                  onChange={(url) => setHallForm(prev => ({ ...prev, vatImage: url }))}
                                  isDark={isDark}
                                  uploadType="hall_document"
                                />
                              )}
                              <SingleDocUploader
                                label="كشف حساب الآييبان"
                                value={hallForm.ibanImage}
                                onChange={(url) => setHallForm(prev => ({ ...prev, ibanImage: url }))}
                                isDark={isDark}
                                uploadType="hall_document"
                              />
                            </div>
                          </div>

                          {/* Cover Video Uploader if enabled */}
                          {videoConfig.videosEnabled && (
                            <div className="space-y-1 mb-3">
                              <CoverVideoUploader
                                videoUrl={(hallForm as any).videoUrl || ''}
                                onChange={(url) => setHallForm(prev => ({ 
                                  ...prev, 
                                  videoUrl: url
                                }))}
                                isDark={isDark}
                                maxSizeMB={videoConfig.maxVideoSizeMB}
                                serverUrl={videoConfig.videoServerUrl}
                              />
                            </div>
                          )}

                          {/* Multi Image facility uploader */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <label className={`text-xs font-black ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>ألبوم صور القاعة (الحد الأقصى ١٥ صورة)</label>
                              <MediaStandardsGuideTrigger 
                                onOpenGuide={() => { setMediaGuideTab('guide'); setIsMediaGuideOpen(true); }}
                                onOpenInspector={() => { setMediaGuideTab('inspector'); setIsMediaGuideOpen(true); }}
                              />
                            </div>
                            <MultiImageUploader
                              images={hallForm.images || []}
                              maxImages={15}
                              uploadType="hall"
                              isDark={isDark}
                              onChange={(newUrls) => setHallForm(prev => ({
                                ...prev,
                                images: newUrls,
                                image: newUrls.length > 0 ? newUrls[0] : prev.image
                              }))}
                            />
                          </div>

                          {/* Pledge regulatory safe checkbox (Moved under image album) */}
                          <div className="p-3 bg-amber-500/5 dark:bg-slate-950 rounded-2xl border border-dashed border-amber-500/30">
                            <label className="flex items-start gap-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                required
                                checked={hallForm.pledge}
                                onChange={e => setHallForm(prev => ({ ...prev, pledge: e.target.checked }))}
                                className="rounded text-amber-500 border-amber-500 focus:ring-amber-500 mt-0.5 animate-pulse"
                              />
                              <div className="font-sans leading-relaxed text-[10px] text-slate-600 dark:text-slate-400">
                                <span className="font-black text-slate-800 dark:text-slate-200 block mb-0.5">التعهد المالي والتثبيتي الإلكتروني</span>
                                أتعهد بصحة وموثوقية كافة البيانات والملفات المدفوعة والفريدة والمرفقة أعلاه، وأتحمل المسؤولية القانونية كاملة عن أي معلومات غير صحيحة بموجب{' '}
                                <a href="/pledge-terms" target="_blank" className="text-amber-500 hover:underline font-extrabold inline-flex items-center gap-0.5">
                                  وثيقة الشروط والتعهد بالمنصة 📑
                                </a>
                              </div>
                            </label>
                          </div>

                        </div>

                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Action Operations Footer Container */}
              <div className={`p-6 md:px-8 border-t shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isDark ? 'border-slate-800 bg-slate-950/20' : 'border-slate-100 bg-slate-50/30'}`}>
                
                {/* Error Banner Container (Left side) */}
                <div className="flex-1 min-w-0 pr-1">
                  <AnimatePresence>
                    {formError && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-center gap-2 text-rose-500 bg-rose-500/10 border border-rose-500/15 py-2 px-3 rounded-xl max-w-full"
                      >
                        <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500 animate-bounce" />
                        <span className="text-xs font-bold line-clamp-1">{formError}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Navigation Buttons (Right side) */}
                <div className="flex items-center justify-end gap-3 shrink-0">
                  
                  {/* Cancel Button (Always visible on first step) */}
                  {hallModalStep === 1 ? (
                    <button
                      key="cancel-btn"
                      type="button"
                      onClick={() => setIsHallModalOpen(false)}
                      className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        isDark 
                          ? 'bg-slate-800 hover:bg-slate-750 text-slate-300' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      إلغاء وإغلاق
                    </button>
                  ) : (
                    /* Previous Button */
                    <button
                      key="prev-btn"
                      type="button"
                      onClick={() => {
                        setHallModalStep(prev => Math.max(1, prev - 1));
                        setFormError('');
                      }}
                      className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                        isDark 
                          ? 'bg-slate-800 hover:bg-slate-750 text-slate-300' 
                          : 'bg-slate-100 hover:bg-slate-250 text-slate-700'
                      }`}
                    >
                      <ChevronRight className="w-4 h-4" />
                      <span>الخطوة السابقة</span>
                    </button>
                  )}

                  {/* Next Step Button (Step 1,2,3) */}
                  {hallModalStep < 4 ? (
                    <button
                      key="next-step-btn"
                      type="button"
                      onClick={() => {
                        if (canGoToNextStep()) {
                          setHallModalStep(prev => prev + 1);
                        }
                      }}
                      className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-white rounded-xl text-xs font-black shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>الخطوة التالية</span>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  ) : (
                    /* Submit Final Button */
                    <button
                      key="submit-final-btn"
                      type="submit"
                      id="save-hall-changes-btn"
                      className="px-6 py-2.5 bg-gradient-to-l from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 active:scale-95 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/15 hover:shadow-emerald-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                      <span>{editingHall ? 'اعتماد وحفظ بيانات التعديل' : 'حفظ ونشر الصرح بالمنصة'}</span>
                    </button>
                  )}

                </div>

              </div>
            </form>
          </div>
        </div>
      )}

      {/* Service Modal Dialog */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div 
            className={`rounded-3xl max-w-4xl w-full h-[95vh] md:h-[620px] flex flex-col justify-between shadow-2xl border animate-in zoom-in-95 duration-200 text-right transition-colors duration-200 overflow-hidden ${
              isDark 
                ? 'bg-slate-900 border-slate-800 text-slate-100' 
                : 'bg-white border-slate-100 text-slate-800'
            }`}
          >
            {/* Modal Header */}
            <div className={`p-6 pb-4 md:px-8 border-b flex items-center justify-between shrink-0 ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/30'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                  <Package className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-black flex items-center gap-2">
                    <span className={isDark ? 'text-slate-100' : 'text-slate-900'}>
                      {editingService ? 'تحديث باقة الخدمة المساندة' : 'تفعيل خدمة مساندة جديدة لعملاك'}
                    </span>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${isDark ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}`}>
                      خدمات النخبة ✨
                    </span>
                  </h2>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {editingService ? 'تعديل وتحديث تفاصيل الباقات المساندة لقاعات عملائك' : 'تفعيل باقة جديدة كلياً وتدشينها للجمهور فوراً في دليل الخدمات'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMediaGuideTab('guide');
                    setIsMediaGuideOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer border border-emerald-400/30 active:scale-95 shrink-0"
                  title="فتح دليل واشتراطات الوسائط والمعايير الأفقية (16:9)"
                >
                  <Camera className="w-4 h-4 text-emerald-100" />
                  <span>📷 دليل وااشتراطات الوسائط (16:9)</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Stepper Progress Bar (Desktop vs Mobile) */}
            <div className={`px-6 py-4 md:px-8 border-b shrink-0 ${isDark ? 'border-slate-800 bg-slate-950/20' : 'border-slate-50 bg-slate-50/20'}`}>
              {/* Stepper Grid for Desktop */}
              <div className="hidden md:flex items-center justify-between relative mt-1 max-w-2xl mx-auto">
                {/* Connecting gold line */}
                <div className="absolute top-1/2 left-4 right-4 h-[3px] -translate-y-1/2 bg-slate-150 dark:bg-slate-800 z-0 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-300"
                    style={{ width: `${((serviceModalStep - 1) / 1) * 100}%` }}
                  />
                </div>

                {[
                  { id: 1, title: 'هوية الباقة والتسعير', icon: Package },
                  { id: 2, title: 'التغطية وتفاصيل المنشور', icon: Sparkles }
                ].map((step) => {
                  const StepIcon = step.icon;
                  const isActive = serviceModalStep === step.id;
                  const isCompleted = serviceModalStep > step.id;
                  
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => {
                        if (step.id < serviceModalStep) {
                          setServiceModalStep(step.id);
                          setServiceFormError('');
                        } else if (step.id > serviceModalStep) {
                          if (canGoToNextServiceStep()) {
                            setServiceModalStep(step.id);
                          }
                        }
                      }}
                      className="relative z-10 flex flex-col items-center gap-1 bg-transparent border-0 cursor-pointer focus:outline-none group"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 border-2 ${
                        isActive 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none scale-110' 
                          : isCompleted 
                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                            : isDark 
                              ? 'bg-slate-800 border-slate-700 text-slate-400' 
                              : 'bg-slate-100 border-slate-200 text-slate-500'
                      }`}>
                        {isCompleted ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                      </div>
                      <span className={`text-xs font-bold transition-all ${
                        isActive 
                          ? 'text-indigo-600 dark:text-indigo-400 scale-105' 
                          : isDark 
                            ? 'text-slate-400 group-hover:text-slate-300' 
                            : 'text-slate-500 group-hover:text-slate-700'
                      }`}>
                        {step.title}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Mobile Stepper */}
              <div className="flex md:hidden items-center justify-between">
                <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  الخطوة <span className="text-indigo-600 dark:text-indigo-400">{serviceModalStep}</span> من 2
                </span>
                <div className="flex gap-1.5">
                  {[1, 2].map(stepIndex => (
                    <div 
                      key={stepIndex} 
                      className={`h-2 rounded-full transition-all duration-200 ${
                        serviceModalStep === stepIndex 
                          ? 'w-6 bg-indigo-600' 
                          : 'w-2 bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Body / Form Container */}
            <form 
              onSubmit={handleSaveService} 
              className="flex-1 overflow-y-auto md:overflow-visible flex flex-col text-right justify-between"
              id="service-form-element"
            >
              <div className="p-6 md:p-8 flex-1 flex flex-col justify-center min-h-[320px]">
                {/* Form Errors */}
                {serviceFormError && (
                  <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2.5 animate-bounce shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                    <span>{serviceFormError}</span>
                  </div>
                )}

                {/* STEP 1: Basic Identity & Financial Details */}
                {serviceModalStep === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in slide-in-from-bottom-3 duration-205">
                    
                    {/* Name */}
                    <div className="space-y-2 md:col-span-2">
                      <label id="lbl-service-name" className={`text-xs font-extrabold tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        اسم باقة الخدمة المساندة <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={serviceForm.name}
                        onChange={e => {
                          setServiceForm(prev => ({ ...prev, name: e.target.value }));
                          setServiceFormError('');
                        }}
                        placeholder="مثال: خدمة تصوير سينمائي احترافي بطائرة درون 4K"
                        className={`w-full p-3.5 rounded-2xl border outline-none text-sm transition-all duration-200 font-medium ${
                          isDark 
                            ? 'bg-slate-850 border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white placeholder-slate-500' 
                            : 'bg-slate-50/50 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 placeholder-slate-400'
                        }`}
                      />
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-2">
                      <label id="lbl-service-cat" className={`text-xs font-extrabold tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        نوع وهيكل الخدمة <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={serviceForm.category}
                        onChange={e => setServiceForm(prev => ({ ...prev, category: e.target.value }))}
                        className={`w-full p-3.5 rounded-2xl border outline-none text-sm cursor-pointer transition-all duration-200 font-semibold ${
                          isDark 
                            ? 'bg-slate-850 border-slate-700 text-white focus:border-indigo-500' 
                            : 'bg-slate-50/50 border-slate-200 text-slate-800 focus:border-indigo-500'
                        }`}
                      >
                        {serviceCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Price with absolute label */}
                    <div className="space-y-2">
                      <label id="lbl-service-price" className={`text-xs font-extrabold tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        سعر الخدمة الأساسي <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          required
                          min={1}
                          value={serviceForm.price}
                          onChange={e => {
                            setServiceForm(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }));
                            setServiceFormError('');
                          }}
                          placeholder="0"
                          className={`w-full p-3.5 pl-12 rounded-2xl border outline-none text-sm transition-all duration-200 font-bold ${
                            isDark 
                              ? 'bg-slate-850 border-slate-700 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20' 
                              : 'bg-slate-50/50 border-slate-200 text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                          }`}
                        />
                        <span className="absolute left-4 text-xs font-black text-indigo-500 uppercase tracking-widest">
                          ر.س
                        </span>
                      </div>
                    </div>

                    {/* Status at Provider */}
                    <div className="space-y-2">
                      <label id="lbl-service-status" className={`text-xs font-extrabold tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        حالة الخدمة بالمنشأة <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={serviceForm.serviceStatus}
                        onChange={e => setServiceForm(prev => ({ ...prev, serviceStatus: e.target.value as any }))}
                        className={`w-full p-3.5 rounded-2xl border outline-none text-sm cursor-pointer transition-all duration-200 font-semibold ${
                          isDark 
                            ? 'bg-slate-850 border-slate-700 text-white focus:border-indigo-500' 
                            : 'bg-slate-50/50 border-slate-200 text-slate-800 focus:border-indigo-500'
                        }`}
                      >
                        <option value="نشط">🟢 نشطة ومتاحة للعملاء</option>
                        <option value="معطل">🔴 معطلة مؤقتاً بالشركة</option>
                      </select>
                    </div>

                    {/* Document Level */}
                    {userRole === 'admin' && (
                      <div className="space-y-2">
                        <label id="lbl-service-admin" className={`text-xs font-extrabold tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          مستوى التوثيق والتميز شرفياً <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={serviceForm.adminStatus}
                          onChange={e => setServiceForm(prev => ({ ...prev, adminStatus: e.target.value as any }))}
                          className={`w-full p-3.5 rounded-2xl border outline-none text-sm cursor-pointer transition-all duration-200 font-semibold ${
                            isDark 
                              ? 'bg-slate-850 border-slate-700 text-white focus:border-indigo-500' 
                              : 'bg-slate-50/50 border-slate-200 text-slate-800 focus:border-indigo-500'
                          }`}
                        >
                          <option value="فعالة">✅ فعالة بالدليل القياسي</option>
                          <option value="موثوقة">✨ موثوقة بالوسام الذهبي</option>
                          <option value="محظورة">🚫 محظورة وموقوفة للإشراف</option>
                        </select>
                      </div>
                    )}

                  </div>
                )}

                {/* STEP 2: Geographic Scope & Content presentation */}
                {serviceModalStep === 2 && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 animate-in fade-in slide-in-from-bottom-3 duration-205">
                    
                    {/* Left details - takes 7 cols on desktop */}
                    <div className="md:col-span-7 space-y-4">
                      {/* Region & City Scope side by side */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label id="lbl-service-region" className={`text-xs font-extrabold tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            منطقة توفير الخدمة
                          </label>
                          <select
                            value={serviceForm.regions}
                            onChange={e => setServiceForm(prev => ({ 
                              ...prev, 
                              regions: e.target.value, 
                              cities: SAUDI_REGIONS.find(r => r.name === e.target.value)?.cities[0] || '' 
                            }))}
                            className={`w-full p-3.5 rounded-2xl border outline-none text-sm cursor-pointer transition-all ${
                              isDark 
                                ? 'bg-slate-850 border-slate-700 text-white focus:border-indigo-500' 
                                : 'bg-slate-50/50 border-slate-200 text-slate-800 focus:border-indigo-500'
                            }`}
                          >
                            {SAUDI_REGIONS.map(r => (
                              <option key={r.name} value={r.name}>{r.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label id="lbl-service-city" className={`text-xs font-extrabold tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            نطاق التغطية بالمدن
                          </label>
                          <select
                            value={serviceForm.cities}
                            onChange={e => setServiceForm(prev => ({ ...prev, cities: e.target.value }))}
                            className={`w-full p-3.5 rounded-2xl border outline-none text-sm cursor-pointer transition-all ${
                              isDark 
                                ? 'bg-slate-850 border-slate-700 text-white focus:border-indigo-500' 
                                : 'bg-slate-50/50 border-slate-200 text-slate-800 focus:border-indigo-500'
                            }`}
                          >
                            {serviceCities.map(city => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Terms */}
                      <div className="space-y-2">
                        <label id="lbl-service-terms" className={`text-xs font-extrabold tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          شروط أو أحكام خاصة لتقديم الخدمة
                        </label>
                        <input
                          type="text"
                          value={serviceForm.terms}
                          onChange={e => setServiceForm(prev => ({ ...prev, terms: e.target.value }))}
                          placeholder="مثال: حجز مسبق قبل المناسبة بـ 7 أيام كحد أدنى"
                          className={`w-full p-3.5 rounded-2xl border outline-none text-sm transition-all ${
                            isDark 
                              ? 'bg-slate-850 border-slate-700 focus:border-indigo-500 text-white placeholder-slate-500' 
                              : 'bg-slate-50/50 border-slate-200 focus:border-indigo-500 text-slate-800 placeholder-slate-400'
                          }`}
                        />
                      </div>

                      {/* Cover Video Uploader if enabled */}
                      {videoConfig.videosEnabled && (
                        <div className="space-y-2">
                          <CoverVideoUploader
                            videoUrl={(serviceForm as any).videoUrl || ''}
                            onChange={(url) => setServiceForm(prev => ({ 
                              ...prev, 
                              videoUrl: url
                            }))}
                            isDark={isDark}
                            maxSizeMB={videoConfig.maxVideoSizeMB}
                            serverUrl={videoConfig.videoServerUrl}
                          />
                        </div>
                      )}

                      {/* Multi-Image Upload */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <label id="lbl-service-image" className={`text-xs font-extrabold tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            صور الخدمة المساندة (الحد الأقصى ١٠ صور)
                          </label>
                          <MediaStandardsGuideTrigger 
                            onOpenGuide={() => { setMediaGuideTab('guide'); setIsMediaGuideOpen(true); }}
                            onOpenInspector={() => { setMediaGuideTab('inspector'); setIsMediaGuideOpen(true); }}
                          />
                        </div>
                        <MultiImageUploader
                          images={serviceForm.images || []}
                          maxImages={10}
                          uploadType="service"
                          isDark={isDark}
                          onChange={(newUrls) => setServiceForm(prev => ({
                            ...prev,
                            images: newUrls,
                            image: newUrls.length > 0 ? newUrls[0] : prev.image
                          }))}
                        />
                      </div>
                    </div>

                    {/* Right column - description and Live preview (takes 5 cols on desktop) */}
                    <div className="md:col-span-5 flex flex-col gap-4">
                      {/* Description Textarea */}
                      <div className="space-y-2">
                        <label id="lbl-service-desc" className={`text-xs font-extrabold tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          تفاصيل ووصف الباقة والخدمة <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={serviceForm.description}
                          onChange={e => {
                            setServiceForm(prev => ({ ...prev, description: e.target.value }));
                            setServiceFormError('');
                          }}
                          placeholder="يرجى كتابة تفاصيل الخدمة وما تشتمل عليه بوضوح للعملاء لزيادة الثقة..."
                          className={`w-full p-3.5 rounded-2xl border outline-none text-sm transition-all resize-none ${
                            isDark 
                              ? 'bg-slate-850 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500' 
                              : 'bg-slate-50/50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500'
                          }`}
                        />
                      </div>

                      {/* Luxury Live Image Preview with Gold Border */}
                      <div className="flex-1 min-h-[110px] rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-850 relative flex flex-col items-center justify-center bg-slate-50/30 dark:bg-slate-950/20 group">
                        {serviceForm.image && serviceForm.image.startsWith('http') ? (
                          <>
                            <img 
                              src={serviceForm.image} 
                              alt="Live Preview" 
                              referrerPolicy="no-referrer"
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=500&q=60';
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-3 text-right">
                              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1 bg-black/40 backdrop-blur-xs w-max px-2 py-0.5 rounded-full">
                                <Sparkles className="w-3 h-3 text-amber-400" />
                                معاينة حية للمنشور
                              </span>
                              <h4 className="text-xs font-bold text-white mt-1 truncate max-w-full drop-shadow-md">
                                {serviceForm.name || 'اسم الخدمة المساندة'}
                              </h4>
                              <p className="text-[10px] font-black text-slate-300 drop-shadow-sm truncate">
                                سعر البدء: {serviceForm.price || '0'} ر.س
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="p-4 text-center flex flex-col items-center gap-2">
                            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                              يرجى تزويد صور الخدمة لدعم الجذب البصري للعملاء
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                )}
              </div>

              {/* Action Operations / Modal Footer */}
              <div className={`p-6 md:px-8 border-t flex items-center justify-between shrink-0 ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
                {/* Back / Navigation button */}
                <div>
                  {serviceModalStep > 1 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setServiceModalStep(prev => prev - 1);
                        setServiceFormError('');
                      }}
                      className={`px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                        isDark 
                          ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white' 
                          : 'bg-white border-slate-250 text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                      }`}
                    >
                      <ChevronRight className="w-4 h-4" />
                      <span>الخطوة السابقة</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsServiceModalOpen(false)}
                      className={`px-5 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer border ${
                        isDark 
                          ? 'bg-transparent border-slate-800 text-slate-400 hover:text-slate-300' 
                          : 'bg-transparent border-slate-200 text-slate-500 hover:text-slate-600'
                      }`}
                    >
                      إلغاء التفعيل
                    </button>
                  )}
                </div>

                {/* Next Step / Complete Save Button */}
                <div className="flex items-center gap-3">
                  {serviceModalStep < 2 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (canGoToNextServiceStep()) {
                          setServiceModalStep(2);
                        }
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-2xl text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>الخطوة التالية</span>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-500/15 hover:shadow-emerald-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
                      id="save-service-changes-btn"
                    >
                      <CheckCircle2 className="w-4 h-4 animate-pulse" />
                      <span>{editingService ? 'تحديث باقة الخدمة' : 'تفعيل باقة الخدمة الآن'}</span>
                    </button>
                  )}
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Custom Package Modal Dialog */}
      {isPkgModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300 font-sans">
          <div 
            className={`rounded-3xl max-w-lg w-full flex flex-col justify-between shadow-2xl border animate-in zoom-in-95 duration-200 text-right overflow-hidden ${
              isDark 
                ? 'bg-slate-900 border-slate-800 text-slate-100' 
                : 'bg-white border-slate-100 text-slate-800'
            }`}
          >
            {/* Modal Header */}
            <div className={`p-6 pb-4 border-b flex items-center justify-between shrink-0 ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/30'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl bg-amber-500/10 text-amber-500`}>
                  👑
                </div>
                <div>
                  <h2 className="text-base font-black">
                    {editingPkgId ? 'تعديل تفاصيل الباقة الشاملة' : 'تصميم باقة خدمات جديدة'}
                  </h2>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    حدد أسعار الفترات والخدمات المدمجة لتسهيل الحجز المباشر لعملائك
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsPkgModalOpen(false)}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Form */}
            <form onSubmit={handleSavePackage} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              {/* Package Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-400">اسم الباقة المخصصة</label>
                <input
                  type="text"
                  required
                  value={pkgName}
                  onChange={(e) => setPkgName(e.target.value)}
                  placeholder="مثال: باقة الياسمين الفاخرة، الباقة الملكية"
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs font-bold transition-all focus:ring-1 focus:ring-amber-500 outline-none ${
                    isDark 
                      ? 'bg-slate-950/60 border-slate-800 text-white placeholder-slate-600 focus:border-amber-500' 
                      : 'bg-slate-50/50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-amber-500'
                  }`}
                />
              </div>

              {/* Base Price & Is Popular Checkbox */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-400">السعر العام الأساسي للباقة (ر.س)</label>
                  <input
                    type="number"
                    required
                    value={pkgPrice}
                    onChange={(e) => setPkgPrice(e.target.value)}
                    placeholder="مثال: 15000"
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs font-bold transition-all focus:ring-1 focus:ring-amber-500 outline-none ${
                      isDark 
                        ? 'bg-slate-950/60 border-slate-800 text-white focus:border-amber-500' 
                        : 'bg-slate-50/50 border-slate-200 text-slate-800 focus:border-amber-500'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-start pr-1 mt-6">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={pkgIsPopular}
                      onChange={(e) => setPkgIsPopular(e.target.checked)}
                      className="text-amber-500 border-slate-300 focus:ring-amber-500 h-4 w-4 cursor-pointer rounded"
                    />
                    <span className="text-[11px] font-black text-slate-500">تمييز كـ الباقة الأكثر طلباً 🔥</span>
                  </label>
                </div>
              </div>

              {/* Pricing breakdown for morning, evening, and full day */}
              <div className="border border-slate-200/40 dark:border-slate-800/60 p-4 rounded-2xl space-y-3 bg-slate-50/30 dark:bg-slate-950/20">
                <span className="text-[10px] font-extrabold text-amber-500 block">⏱️ أسعار مخصصة حسب الفترات الزمنية (اختياري)</span>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400">الصباحية (ر.س)</label>
                    <input
                      type="number"
                      value={pkgMorningPrice}
                      onChange={(e) => setPkgMorningPrice(e.target.value)}
                      placeholder="تلقائي"
                      className={`w-full px-3 py-2 rounded-lg border text-[10px] font-bold transition-all outline-none ${
                        isDark 
                          ? 'bg-slate-950/60 border-slate-800 text-white' 
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400">المسائية (ر.س)</label>
                    <input
                      type="number"
                      value={pkgNightPrice}
                      onChange={(e) => setPkgNightPrice(e.target.value)}
                      placeholder="تلقائي"
                      className={`w-full px-3 py-2 rounded-lg border text-[10px] font-bold transition-all outline-none ${
                        isDark 
                          ? 'bg-slate-950/60 border-slate-800 text-white' 
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400">يوم كامل (ر.س)</label>
                    <input
                      type="number"
                      value={pkgFullDayPrice}
                      onChange={(e) => setPkgFullDayPrice(e.target.value)}
                      placeholder="تلقائي"
                      className={`w-full px-3 py-2 rounded-lg border text-[10px] font-bold transition-all outline-none ${
                        isDark 
                          ? 'bg-slate-950/60 border-slate-800 text-white' 
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Package Content/Included Services */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-400">الخدمات المندرجة والمشمولة بالباقة</label>
                <textarea
                  required
                  rows={4}
                  value={pkgDesc}
                  onChange={(e) => setPkgDesc(e.target.value)}
                  placeholder="افصل بين كل خدمة وأخرى بـ فاصلة (،) أو سطر جديد لتظهر كقائمة نقطية منسقة للعميل.&#10;مثال: بوفيه فاخر لـ 150 شخص، دي جي، كوشة عصرية، تجهيز الصوت والإضاءة"
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs font-bold leading-relaxed transition-all focus:ring-1 focus:ring-amber-500 outline-none resize-none ${
                    isDark 
                      ? 'bg-slate-950/60 border-slate-800 text-white placeholder-slate-600 focus:border-amber-500' 
                      : 'bg-slate-50/50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-amber-500'
                  }`}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPkgModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                    isDark 
                      ? 'bg-transparent border-slate-800 text-slate-400 hover:text-slate-300 hover:bg-slate-850' 
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  إلغاء وتراجع
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-amber-500/10 transition-all flex items-center gap-1 cursor-pointer"
                >
                  {editingPkgId ? 'تأكيد التحديث' : 'حفظ وإضافة الباقة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Impact Notification Modal for Lifecycle & Versioning Changes */}
      {isImpactModalOpen && impactModalData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300 font-sans">
          <div 
            className={`rounded-3xl max-w-xl w-full flex flex-col justify-between shadow-2xl border animate-in zoom-in-95 duration-200 text-right overflow-hidden ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-800'
            }`}
          >
            {/* Header */}
            <div className="p-6 border-b border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black">
                      {impactModalData.entityType === 'hall' ? 'إشعار بتأثير تعديل بيانات القاعة' : 'إشعار بتأثير تعديل بيانات الخدمة'}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-950 text-amber-300 border border-amber-400/30">
                      v{impactModalData.version}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{impactModalData.entityName}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsImpactModalOpen(false)}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
              {/* Mandatory Impact Warning Banner (Exact Requirement) */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-right space-y-2">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-black text-sm">
                  <span className="text-base">⚠️</span>
                  <span>تحذير إشعار بالتأثير (Impact Notification)</span>
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed bg-amber-50 dark:bg-slate-800/80 p-3 rounded-xl border border-amber-200 dark:border-amber-900/50">
                  "هذا التغيير ينطبق فقط على الحجوزات المستقبلية. لديك <span className="text-amber-700 dark:text-amber-400 font-extrabold text-sm underline decoration-amber-500 underline-offset-4">{impactModalData.activeBookingsCount}</span> من الحجوزات المؤكدة التي لم تتأثر بعد."
                </p>
              </div>

              {/* Version & Pricing Diff Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                {impactModalData.previousPrice !== undefined && impactModalData.newPrice !== undefined && (
                  <div>
                    <span className="text-[10px] font-black text-slate-400 block mb-1">تحديث السعر الأساسي:</span>
                    <div className="flex items-center gap-2 text-xs font-bold font-sans">
                      <span className="text-slate-400 line-through">{impactModalData.previousPrice.toLocaleString('ar-SA')} ر.س</span>
                      <span className="text-amber-500">←</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-black">{impactModalData.newPrice.toLocaleString('ar-SA')} ر.س</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Immutable Snapshot Guarantee Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-500 text-white shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-emerald-900 dark:text-emerald-300">
                    حماية العقود والحجوزات القائمة (Immutable Snapshots)
                  </h4>
                  <p className="text-[11px] text-emerald-800/80 dark:text-emerald-400/80 mt-1 leading-relaxed">
                    يضمن النظام تجميد كافة الحجوزات السابقة ({impactModalData.activeBookingsCount} حجز/طلب نشط) المسجلة على هذه المنشأة/الخدمة بالسعر والشروط السابقة دون أدنى مساس بالفواتير المعتمدة لعملائك أو التزاماتك المالية السابقة.
                  </p>
                </div>
              </div>

              {/* Impact Details Checklist */}
              <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                  <span>سيتم تدوين وحفظ هذه العملية تلقائياً في سجل التدقيق غير القابل للتعديل <strong>(Audit Log)</strong>.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                  <span>التسعيرة والإصدار الجديد <strong>(v{impactModalData.version})</strong> يسري على جميع الحجوزات والطلبات الجديدة القادمة.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0"></span>
                  <span>حماية قوائم الرغبات (Wishlists): يتم تحديث البطاقات تلقائياً مع الحفاظ على الروابط سليمة دون أي انقطاع.</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
              {impactModalData.isPreSave ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsImpactModalOpen(false)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    }`}
                  >
                    إلغاء والعودة للنموذج
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (impactModalData.entityType === 'hall') {
                        handleSaveHall(undefined, true);
                      } else {
                        handleSaveService(undefined, true);
                      }
                    }}
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all cursor-pointer"
                  >
                    تأكيد ومتابعة الحفظ وترقية الإصدار (v{impactModalData.version}) ⚡
                  </button>
                </>
              ) : (
                <div className="w-full flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsImpactModalOpen(false)}
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all cursor-pointer"
                  >
                    فهمت واعتمدت التحديث
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Audit Log / Versioning History Modal */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300 font-sans">
          <div 
            className={`rounded-3xl max-w-3xl w-full flex flex-col justify-between shadow-2xl border animate-in zoom-in-95 duration-200 text-right overflow-hidden ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-800'
            }`}
          >
            {/* Header */}
            <div className="p-6 border-b border-purple-500/20 bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-purple-600/20">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black">سجل التدقيق والتغييرات التاريخية (Audit Log)</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                      حوكمة الأصول
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedAuditEntity 
                      ? `سجل التغييرات الكامل لـ: ${selectedAuditEntity.name}` 
                      : 'سجل تدقيق شامل لجميع عمليات التعديل والإيقاف والأرشفة'}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setIsAuditModalOpen(false);
                  setSelectedAuditEntity(null);
                }}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Audit Logs Content */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[65vh]">
              {(() => {
                const logs = (() => {
                  try {
                    const raw = localStorage.getItem('layla_audit_logs');
                    const parsed: AuditLog[] = raw ? JSON.parse(raw) : [];
                    if (selectedAuditEntity) {
                      return parsed.filter((l) => String(l.entityId) === String(selectedAuditEntity.id));
                    }
                    return parsed;
                  } catch {
                    return [];
                  }
                })();

                if (logs.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-400">
                      <History className="w-10 h-10 mx-auto mb-2 opacity-40 text-purple-400" />
                      <p className="text-xs font-bold">لا توجد سجلات تدقيق مسجلة بعد لهذا العنصر.</p>
                      <p className="text-[10px] text-slate-400 mt-1">يتم إنشاء السجلات آلياً عند تعديل الأسعار، السعات، أو تبديل حالة التشغيل.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {logs.map((log) => (
                      <div 
                        key={log.id}
                        className="p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex flex-col gap-2 transition-all hover:border-purple-300 dark:hover:border-purple-700"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                              {log.action === 'create' ? 'إنشاء جديد' : log.action === 'update' ? 'تعديل بنود' : log.action === 'status_change' ? 'تغيير حالة التشغيل' : log.action}
                            </span>
                            <span className="font-bold text-slate-800 dark:text-slate-100">{log.entityName}</span>
                            {log.newValues?.version && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-slate-900 text-amber-300">
                                v{log.newValues.version}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-sans" dir="ltr">
                            {new Date(log.timestamp).toLocaleString('ar-SA')}
                          </span>
                        </div>

                        {/* Details diff */}
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 mt-1">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{log.details}</p>
                          {log.impactSummary && (
                            <p className="text-[10px] text-emerald-800 dark:text-emerald-400 font-medium">{log.impactSummary}</p>
                          )}
                        </div>

                        {/* Actor & Isolation note */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-200/40 dark:border-slate-800">
                          <span>المنفذ: <strong>{log.actorName || 'المزود المسجل'}</strong> ({log.actorRole === 'admin' ? 'الإدارة' : 'المزود'})</span>
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium">سجل مؤكد ومشفّر</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">معايير حوكمة بيانات المنصات الضخمة (Enterprise Data Governance)</span>
              <button
                type="button"
                onClick={() => {
                  setIsAuditModalOpen(false);
                  setSelectedAuditEntity(null);
                }}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />

      {/* Real-time Provider Chat Modal */}
      <ProviderChatModal
        isOpen={isProviderChatOpen}
        onClose={() => setIsProviderChatOpen(false)}
        providerName={chatData.providerName}
        hallName={chatData.hallName}
      />

      {/* Interactive Media Standards Guide & Inspector Modal */}
      <MediaStandardsGuideModal
        isOpen={isMediaGuideOpen}
        onClose={() => setIsMediaGuideOpen(false)}
        defaultTab={mediaGuideTab}
      />
    </div>
  );
}
