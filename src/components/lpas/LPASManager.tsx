/**
 * @file LPASManager.tsx
 * @description Lailah Provider Acquisition & Landing Page System (LPAS) Growth Studio.
 * Allows marketing, growth managers, and admins to manage, test, preview, and create targeted landing pages.
 */

import React, { useState } from 'react';
import { 
  Megaphone, Plus, Globe, Eye, Copy, Check, Sparkles, Filter, 
  Trash2, Edit3, Shield, ArrowRight, Share2, Layers, MapPin, 
  Tag, Calendar, BarChart2, RefreshCw, Smartphone, Monitor, ExternalLink
} from 'lucide-react';
import { LPASLandingPage, LPASPageType } from '../../types/lpas';
import { getLPASPages, saveLPASPages, getLPASAttribution } from '../../data/lpasData';
import { LPASPageRenderer } from './LPASPageRenderer';

interface LPASManagerProps {
  onBackToDashboard?: () => void;
  onSelectPageToRegister: (context?: {
    providerType?: 'VENUE' | 'SERVICE_PROVIDER' | 'ALL';
    defaultCategory?: string;
    defaultCity?: string;
    landingPageId?: string;
  }) => void;
}

export const LPASManager: React.FC<LPASManagerProps> = ({
  onBackToDashboard,
  onSelectPageToRegister
}) => {
  const [pages, setPages] = useState<LPASLandingPage[]>(getLPASPages());
  const [activeTab, setActiveTab] = useState<'LIST' | 'PREVIEW' | 'CREATE' | 'ATTRIBUTION'>('LIST');
  const [selectedPage, setSelectedPage] = useState<LPASLandingPage>(pages[0]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'DESKTOP' | 'MOBILE'>('DESKTOP');

  // Form state for creating a new custom Landing Page
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newHeadline, setNewHeadline] = useState('');
  const [newSubheadline, setNewSubheadline] = useState('');
  const [newProviderType, setNewProviderType] = useState<'VENUE' | 'SERVICE_PROVIDER' | 'ALL'>('VENUE');
  const [newCity, setNewCity] = useState<'riyadh' | 'jeddah' | 'dammam' | 'all'>('riyadh');
  const [newCategory, setNewCategory] = useState<'venue' | 'catering' | 'flowers' | 'photography' | 'all'>('venue');
  const [newPageType, setNewPageType] = useState<LPASPageType>('COMBINED_TARGETED');

  const currentAttribution = getLPASAttribution();

  const handleCopyUrl = (slug: string) => {
    const fullUrl = `${window.location.origin}/landing/${slug}?utm_source=growth_studio&utm_campaign=${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  const handleOpenPage = (slug: string) => {
    window.open(`/landing/${slug}?utm_source=growth_studio&utm_campaign=${slug}`, '_blank');
  };

  const handleCreatePage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSlug.trim() || !newHeadline.trim()) {
      alert('يرجى ملء كافة الحقول الأساسية لصفحة الهبوط.');
      return;
    }

    const newPage: LPASLandingPage = {
      id: `lpas-custom-${Date.now()}`,
      slug: newSlug.trim().toLowerCase().replace(/\s+/g, '-'),
      pageType: newPageType,
      title: newTitle.trim(),
      subtitle: `صفحة هبوط مخصصة استهدافية - ${newCity === 'riyadh' ? 'الرياض' : newCity === 'jeddah' ? 'جدة' : 'جميع المدن'}`,
      badgeText: '🎯 حملة هبوط مخصصة جديدة',
      heroHeadline: newHeadline.trim(),
      heroSubheadline: newSubheadline.trim() || 'سجل منشأتك أو خدمتك الآن في منصة ليلة واستقبل طلبات الحجز الفورية.',
      heroImageUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
      targetProviderType: newProviderType,
      targetCityId: newCity,
      targetCategoryId: newCategory,
      targetCityNameAr: newCity === 'riyadh' ? 'الرياض' : newCity === 'jeddah' ? 'جدة' : 'جميع المدن',
      targetCategoryNameAr: newCategory === 'venue' ? 'قاعات وأماكن' : newCategory === 'catering' ? 'ضيافة وبوفيهات' : 'تصوير وتوثيق',
      seoTitle: `${newTitle.trim()} - منصة ليلة`,
      seoDescription: newSubheadline.trim(),
      keywords: ['ليلة', newTitle.trim(), 'حجز مناسبات'],
      benefits: selectedPage.benefits,
      processSteps: selectedPage.processSteps,
      keyFeatures: selectedPage.keyFeatures,
      testimonials: selectedPage.testimonials,
      faqItems: selectedPage.faqItems,
      primaryCTATtext: 'ابدأ التسجيل والانضمام الآن',
      secondaryCTATtext: 'تعرف على المزايا',
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };

    const updated = [newPage, ...pages];
    setPages(updated);
    saveLPASPages(updated);
    setSelectedPage(newPage);
    setActiveTab('PREVIEW');
    
    // Reset form
    setNewTitle('');
    setNewSlug('');
    setNewHeadline('');
    setNewSubheadline('');
  };

  const filteredPages = pages.filter(p => {
    if (filterType === 'ALL') return true;
    return p.pageType === filterType || p.targetProviderType === filterType;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans dir-rtl" dir="rtl">
      
      {/* Top Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 sm:p-6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-white">استوديو محرك صفحات الهبوط (LPAS Growth Studio)</h1>
                <span className="bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                  v1.0 ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                إدارة القوالب الديناميكية، الحملات التسويقية، والتأثير المباشر على خفض احتكاك التسجيل.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700"
              >
                <ArrowRight className="w-4 h-4" />
                <span>العودة للوحة التحكم</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('CREATE')}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-400/10"
            >
              <Plus className="w-4 h-4" />
              <span>تدشين صفحة هبوط جديدة</span>
            </button>
          </div>

        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto mt-6 flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('LIST')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'LIST' ? 'bg-amber-400 text-slate-950 shadow-md' : 'bg-slate-800/60 text-slate-400 hover:text-white'}`}
          >
            <Layers className="w-4 h-4" />
            <span>قائمة صفحات الهبوط المعتمدة ({pages.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('PREVIEW')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'PREVIEW' ? 'bg-amber-400 text-slate-950 shadow-md' : 'bg-slate-800/60 text-slate-400 hover:text-white'}`}
          >
            <Eye className="w-4 h-4" />
            <span>معاينة الصفحة الحالية ({selectedPage.slug})</span>
          </button>

          <button
            onClick={() => setActiveTab('CREATE')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'CREATE' ? 'bg-amber-400 text-slate-950 shadow-md' : 'bg-slate-800/60 text-slate-400 hover:text-white'}`}
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء قالب مخصص</span>
          </button>

          <button
            onClick={() => setActiveTab('ATTRIBUTION')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'ATTRIBUTION' ? 'bg-amber-400 text-slate-950 shadow-md' : 'bg-slate-800/60 text-slate-400 hover:text-white'}`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>مراقبة سياق الاكتساب (UTM Pipeline)</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        
        {/* TAB 1: LIST OF LANDING PAGES */}
        {activeTab === 'LIST' && (
          <div className="space-y-6">
            
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black text-slate-300">تصنيف العرض:</span>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-slate-950 text-white text-xs font-bold p-2 rounded-xl border border-slate-700 outline-none"
                >
                  <option value="ALL">جميع صفحات الهبوط ({pages.length})</option>
                  <option value="VENUE">خاصة بالقاعات والأماكن</option>
                  <option value="SERVICE_PROVIDER">خاصة بمزودي الخدمات</option>
                  <option value="ACQUISITION_GENERAL">الصفحة الأم العامة</option>
                  <option value="SEASONAL_CAMPAIGN">الحملات الموسمية</option>
                </select>
              </div>

              <div className="text-xs text-slate-400 font-mono">
                LPAS REGISTRY ENGINE • LAILAH PLATFORM
              </div>
            </div>

            {/* Pages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPages.map((page) => (
                <div 
                  key={page.id}
                  className="bg-slate-900 rounded-2xl border border-slate-800 hover:border-amber-400/50 transition-all p-5 space-y-4 relative flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="bg-amber-400/10 text-amber-300 text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full border border-amber-400/30">
                        {page.pageType}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-950 px-2 py-0.5 rounded-md">
                        /{page.slug}
                      </span>
                    </div>

                    {/* Title & Subtitle */}
                    <div>
                      <h3 className="text-base font-black text-white group-hover:text-amber-300 transition-colors">
                        {page.title}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium line-clamp-2 mt-1">
                        {page.heroSubheadline}
                      </p>
                    </div>

                    {/* Metadata pill */}
                    <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-300">
                      <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-amber-400" />
                        <span>{page.targetProviderType === 'VENUE' ? 'قاعات' : page.targetProviderType === 'SERVICE_PROVIDER' ? 'خدمات' : 'عام'}</span>
                      </span>

                      {page.targetCityNameAr && (
                        <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-400" />
                          <span>{page.targetCityNameAr}</span>
                        </span>
                      )}

                      {page.campaignCode && (
                        <span className="bg-amber-400/20 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-400/40">
                          {page.campaignCode}
                        </span>
                      )}
                    </div>

                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-1.5 mt-2">
                    <button
                      onClick={() => {
                        setSelectedPage(page);
                        setActiveTab('PREVIEW');
                      }}
                      className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer"
                      title="معاينة داخلية"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>معاينة</span>
                    </button>

                    <button
                      onClick={() => handleOpenPage(page.slug)}
                      className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                      title="فتح صفحة الهبوط العامة في نافذة جديدة"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>فتح الصفـحة</span>
                    </button>

                    <button
                      onClick={() => handleCopyUrl(page.slug)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer border border-slate-700"
                      title="نسخ رابط الحملة"
                    >
                      <Copy className="w-3.5 h-3.5 text-amber-400" />
                      <span>{copiedSlug === page.slug ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                    </button>
                  </div>

                </div>
              ))}
            </div>

          </div>
        )}

        {/* TAB 2: PREVIEW LANDING PAGE */}
        {activeTab === 'PREVIEW' && (
          <div className="space-y-4">
            
            {/* Device Switcher & Info Header */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-white">معاينة حية:</span>
                <span className="bg-amber-400 text-slate-950 font-black text-xs px-3 py-0.5 rounded-full">
                  {selectedPage.title}
                </span>
                <span className="text-xs font-mono text-slate-400">({selectedPage.slug})</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setPreviewDevice('DESKTOP')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${previewDevice === 'DESKTOP' ? 'bg-amber-400 text-slate-950' : 'text-slate-400'}`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>شاشة كمبيوتر</span>
                  </button>
                  <button
                    onClick={() => setPreviewDevice('MOBILE')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${previewDevice === 'MOBILE' ? 'bg-amber-400 text-slate-950' : 'text-slate-400'}`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>جوال</span>
                  </button>
                </div>

                <button
                  onClick={() => onSelectPageToRegister({
                    providerType: selectedPage.targetProviderType,
                    defaultCategory: selectedPage.targetCategoryId !== 'all' ? selectedPage.targetCategoryId : undefined,
                    defaultCity: selectedPage.targetCityId !== 'all' ? selectedPage.targetCityId : undefined,
                    landingPageId: selectedPage.id
                  })}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black transition-all cursor-pointer"
                >
                  اختبار الانتقال للتسجيل المباشر
                </button>
              </div>
            </div>

            {/* Embedded Container */}
            <div className={`mx-auto transition-all duration-500 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl ${previewDevice === 'MOBILE' ? 'max-w-md' : 'w-full'}`}>
              <LPASPageRenderer
                page={selectedPage}
                onNavigateToRegistration={(context) => onSelectPageToRegister(context)}
                onViewOtherPages={() => setActiveTab('LIST')}
              />
            </div>

          </div>
        )}

        {/* TAB 3: CREATE CUSTOM LANDING PAGE */}
        {activeTab === 'CREATE' && (
          <div className="max-w-3xl mx-auto bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
            <div className="space-y-1 text-right border-b border-slate-800 pb-4">
              <h2 className="text-xl font-black text-white">تدشين صفحة هبوط استهدافية جديدة (LPAS Generator)</h2>
              <p className="text-xs text-slate-400 font-medium">
                قم بإنشاء صفحة هبوط مخصصة لمدينة أو فئة خدمة أو حملة إعلانية محددة دون الحاجة لكتابة كود برمجي جديد.
              </p>
            </div>

            <form onSubmit={handleCreatePage} className="space-y-5 text-right">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-300">عنوان صفحة الهبوط *</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="مثال: مصورو ومصورات الأعراس والمناسبات في جدة"
                    className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-xs font-bold text-white outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-300">الرمز المعرّف (Slug URL) *</label>
                  <input
                    type="text"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    placeholder="مثال: photography-jeddah"
                    className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-xs font-mono font-bold text-amber-300 outline-none focus:border-amber-400"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-300">نوع الشريك المستهدف</label>
                  <select
                    value={newProviderType}
                    onChange={(e) => setNewProviderType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-xs font-bold text-white outline-none"
                  >
                    <option value="VENUE">قاعات واستراحات (VENUE)</option>
                    <option value="SERVICE_PROVIDER">مزودي خدمات مساندة (SERVICE)</option>
                    <option value="ALL">الجميع (ALL)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-300">المدينة المستهدفة</label>
                  <select
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-xs font-bold text-white outline-none"
                  >
                    <option value="riyadh">الرياض (Riyadh)</option>
                    <option value="jeddah">جدة (Jeddah)</option>
                    <option value="dammam">المنطقة الشرقية (Dammam/Khobar)</option>
                    <option value="all">كافة المدن (All)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-300">فئة الخدمة المستهدفة</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-xs font-bold text-white outline-none"
                  >
                    <option value="venue">قاعات وأماكن</option>
                    <option value="catering">ضيافة وبوفيهات</option>
                    <option value="photography">تصوير وتوثيق</option>
                    <option value="flowers">ورد وتنسيق</option>
                    <option value="all">جميع الفئات</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-300">المانشيت العريض (Hero Headline) *</label>
                <input
                  type="text"
                  value={newHeadline}
                  onChange={(e) => setNewHeadline(e.target.value)}
                  placeholder="مثال: وصل خدمات التصوير الاحترافي إلى آلاف عرسان جدة"
                  className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-xs font-bold text-white outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-300">الوصف التوضيحي الفرعي</label>
                <textarea
                  value={newSubheadline}
                  onChange={(e) => setNewSubheadline(e.target.value)}
                  rows={2}
                  placeholder="صف القيمة المضافة المزودة لهذا القطاع..."
                  className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-xs font-medium text-slate-200 outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm rounded-2xl transition-all cursor-pointer shadow-xl shadow-amber-400/10 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                <span>حفظ القالب وتوليد صفحة الهبوط فوراً</span>
              </button>

            </form>
          </div>
        )}

        {/* TAB 4: ATTRIBUTION MONITOR */}
        {activeTab === 'ATTRIBUTION' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-mono font-black text-amber-400">UTM & ACQUISITION ATTRIBUTION CONTEXT</span>
                <h3 className="text-base font-black text-white">سياق تتبع الاكتساب والتحويل النشط حالياً</h3>
              </div>

              {currentAttribution ? (
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 font-mono text-xs text-amber-300 space-y-2 overflow-x-auto">
                  <div className="text-slate-400 text-[10px] font-sans font-bold">تم التقاط وسوم الحملة والسياق أثناء التصفح:</div>
                  <pre className="text-xs leading-relaxed">{JSON.stringify(currentAttribution, null, 2)}</pre>
                </div>
              ) : (
                <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 text-center text-slate-400 text-xs font-medium">
                  لا يوجد سياق اكتساب نشط في هذه الجلسة حالياً. يمكنك معاينة أي صفحة هبوط لإنشاء سياق التتبع آلياً.
                </div>
              )}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
