import React, { useState, useEffect } from 'react';
import {
  FileText, Shield, HelpCircle, Info, Sliders, CheckCircle2,
  Clock, Plus, Trash2, Edit3, ArrowUp, ArrowDown, Save,
  RotateCcw, History, AlertCircle, Eye, Tag, Users, Check,
  ChevronDown, ChevronUp, Lock, RefreshCw, Send, Upload,
  Copy, Search, Filter, Sparkles, ExternalLink, Columns
} from 'lucide-react';
import AdvancedLegalEditor from './AdvancedLegalEditor';
import WordImportModal from './WordImportModal';
import LegalLivePreviewModal from './LegalLivePreviewModal';

export interface LegalCmsManagerProps {
  showToast?: (message: string, type: 'success' | 'error') => void;
}

export default function LegalCmsManager({ showToast }: LegalCmsManagerProps) {
  const [activeSubTab, setActiveSubTab] = useState<'TERMS_AND_CONDITIONS' | 'PRIVACY_POLICY' | 'ABOUT_US' | 'FAQ' | 'SOVEREIGN_CONFIG'>('TERMS_AND_CONDITIONS');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Search & Filter state
  const [sectionSearchQuery, setSectionSearchQuery] = useState('');
  const [faqSearchQuery, setFaqSearchQuery] = useState('');

  // Modals state
  const [showImportModal, setShowImportModal] = useState(false);
  const [showLivePreviewModal, setShowLivePreviewModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Document state
  const [currentDoc, setCurrentDoc] = useState<any>(null);
  const [docHistory, setDocHistory] = useState<any[]>([]);
  const [selectedHistoryVer, setSelectedHistoryVer] = useState<any | null>(null);

  // Section editing state
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(null);
  const [sectionForm, setSectionForm] = useState({
    id: '',
    title: '',
    content: '',
    order: 0,
    requiredCapability: '',
    isActive: true
  });
  const [showSectionModal, setShowSectionModal] = useState(false);

  // FAQ state
  const [faqs, setFaqs] = useState<any[]>([]);
  const [faqCategoryFilter, setFaqCategoryFilter] = useState('ALL');
  const [faqAudienceFilter, setFaqAudienceFilter] = useState('ALL');
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<any | null>(null);
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    category: 'booking',
    audience: 'ALL',
    order: 0,
    requiredCapability: '',
    isActive: true
  });

  // Sovereign Config State
  const [sovereignConfig, setSovereignConfig] = useState({
    defaultProviderReviewDeadlineHours: 24,
    allowedProviderDeadlineOptions: [1, 3, 7, 12, 24],
    customerPaymentDeadlines: {
      APPROVAL_BEFORE_PAYMENT: 24,
      PAYMENT_BEFORE_APPROVAL: 24,
      INSTANT_CONFIRMATION: 2,
      AUTHORIZE_THEN_CAPTURE: 24
    },
    maxPaymentAttempts: {
      APPROVAL_BEFORE_PAYMENT: 3,
      PAYMENT_BEFORE_APPROVAL: 3,
      INSTANT_CONFIRMATION: 3,
      AUTHORIZE_THEN_CAPTURE: 3
    }
  });

  const [changeSummary, setChangeSummary] = useState('');

  // Fetch document or FAQs on tab switch
  useEffect(() => {
    if (['TERMS_AND_CONDITIONS', 'PRIVACY_POLICY', 'ABOUT_US'].includes(activeSubTab)) {
      loadDocument(activeSubTab);
    } else if (activeSubTab === 'FAQ') {
      loadFaqs();
    } else if (activeSubTab === 'SOVEREIGN_CONFIG') {
      loadSovereignConfig();
    }
  }, [activeSubTab]);

  const loadDocument = async (type: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/legal/documents/${type}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentDoc(data);
        setChangeSummary('');
      }
      // Load history
      const histRes = await fetch(`/api/legal/documents/${type}/history`);
      if (histRes.ok) {
        const historyData = await histRes.json();
        setDocHistory(historyData);
      }
    } catch (err) {
      console.error('Failed to load legal document:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFaqs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/legal/faqs/admin');
      if (res.ok) {
        const data = await res.json();
        setFaqs(data);
      }
    } catch (err) {
      console.error('Failed to load FAQs:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSovereignConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/legal/sovereign-policy-config');
      if (res.ok) {
        const data = await res.json();
        setSovereignConfig(data);
      }
    } catch (err) {
      console.error('Failed to load sovereign config:', err);
    } finally {
      setLoading(false);
    }
  };

  // Save/Publish Document
  const handleSaveDocument = async (status: 'DRAFT' | 'PUBLISHED') => {
    if (!currentDoc) return;
    setSaving(true);
    try {
      const res = await fetch('/api/legal/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': '1',
          'x-user-role': 'admin'
        },
        body: JSON.stringify({
          documentType: currentDoc.documentType,
          version: currentDoc.version,
          title: currentDoc.title,
          subtitle: currentDoc.subtitle,
          introText: currentDoc.introText,
          sections: currentDoc.sections,
          status,
          changeSummary: changeSummary || (status === 'PUBLISHED' ? `نشر إصدار v${currentDoc.version}` : 'حفظ كمسودة تعديل'),
          effectiveAt: currentDoc.effectiveAt || new Date().toISOString()
        })
      });

      if (res.ok) {
        const saved = await res.json();
        setCurrentDoc(saved);
        if (showToast) showToast(status === 'PUBLISHED' ? 'تم نشر الوثيقة والإصدار بنجاح! 🎉' : 'تم حفظ المسودة بنجاح! 💾', 'success');
        loadDocument(currentDoc.documentType);
      } else {
        const errData = await res.json();
        if (showToast) showToast(errData.error || 'فشل حفظ الوثيقة', 'error');
      }
    } catch (err: any) {
      if (showToast) showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Section Handlers
  const handleOpenAddSection = () => {
    setEditingSectionIndex(null);
    setSectionForm({
      id: `sec_${Date.now()}`,
      title: '',
      content: '',
      order: currentDoc?.sections ? currentDoc.sections.length + 1 : 1,
      requiredCapability: '',
      isActive: true
    });
    setShowSectionModal(true);
  };

  const handleOpenEditSection = (index: number) => {
    if (!currentDoc || !currentDoc.sections[index]) return;
    setEditingSectionIndex(index);
    setSectionForm({ ...currentDoc.sections[index] });
    setShowSectionModal(true);
  };

  const handleDuplicateSection = (index: number) => {
    if (!currentDoc || !currentDoc.sections[index]) return;
    const target = currentDoc.sections[index];
    const duplicate = {
      ...target,
      id: `sec_${Date.now()}`,
      title: `${target.title} (نسخة مكررة)`,
      order: currentDoc.sections.length + 1
    };
    const newSections = [...currentDoc.sections, duplicate];
    setCurrentDoc({ ...currentDoc, sections: newSections });
    if (showToast) showToast('تم تكرار البند بنجاح. لا تنسَ حفظ الوثيقة لتثبيت التغييرات.', 'success');
  };

  const handleSaveSection = () => {
    if (!currentDoc) return;
    const newSections = [...(currentDoc.sections || [])];
    if (editingSectionIndex !== null) {
      newSections[editingSectionIndex] = { ...sectionForm };
    } else {
      newSections.push({ ...sectionForm });
    }
    setCurrentDoc({ ...currentDoc, sections: newSections });
    setShowSectionModal(false);
    if (showToast) showToast('تم تحديث البند بنجاح. يرجى حفظ الوثيقة لتثبيت التغييرات.', 'success');
  };

  const handleDeleteSection = (index: number) => {
    if (!currentDoc) return;
    if (!window.confirm('هل أنت متأكد من حذف هذا البند؟')) return;
    const newSections = currentDoc.sections.filter((_: any, i: number) => i !== index);
    setCurrentDoc({ ...currentDoc, sections: newSections });
    if (showToast) showToast('تم حذف البند. يرجى حفظ الوثيقة لتثبيت التغييرات.', 'success');
  };

  const handleToggleSectionActive = (index: number) => {
    if (!currentDoc) return;
    const newSections = [...currentDoc.sections];
    newSections[index].isActive = !newSections[index].isActive;
    setCurrentDoc({ ...currentDoc, sections: newSections });
    if (showToast) showToast(newSections[index].isActive ? 'تم تفعيل البند' : 'تم تعطيل البند مؤقتاً', 'success');
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    if (!currentDoc) return;
    const newSections = [...currentDoc.sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    // Update order numbers
    newSections.forEach((sec, idx) => {
      sec.order = idx + 1;
    });

    setCurrentDoc({ ...currentDoc, sections: newSections });
  };

  // Word Import Handlers
  const handleImportDocumentFromWord = (imported: {
    title?: string;
    subtitle?: string;
    introText?: string;
    sections: any[];
    mode: 'replace' | 'append';
  }) => {
    if (!currentDoc) return;
    let finalSections = [];
    if (imported.mode === 'replace') {
      finalSections = imported.sections;
    } else {
      const existing = currentDoc.sections || [];
      finalSections = [...existing, ...imported.sections];
    }

    // Reassign orders
    finalSections.forEach((sec, idx) => {
      sec.order = idx + 1;
    });

    setCurrentDoc({
      ...currentDoc,
      title: imported.title || currentDoc.title,
      subtitle: imported.subtitle || currentDoc.subtitle,
      introText: imported.introText || currentDoc.introText,
      sections: finalSections
    });

    if (showToast) {
      showToast(`تم استيراد ${imported.sections.length} بنود بنجاح من ملف الوورد بتنسيق المنصة! 📄`, 'success');
    }
  };

  const handleImportFaqsFromWord = async (imported: {
    faqs: any[];
    mode: 'replace' | 'append';
  }) => {
    try {
      for (const item of imported.faqs) {
        await fetch('/api/legal/faqs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
      }
      loadFaqs();
      if (showToast) {
        showToast(`تم استيراد ${imported.faqs.length} سؤال شائع بنجاح! ❓`, 'success');
      }
    } catch (err: any) {
      if (showToast) showToast('حدث خطأ أثناء حفظ الأسئلة المستوردة', 'error');
    }
  };

  // FAQ Handlers
  const handleOpenAddFaq = () => {
    setEditingFaq(null);
    setFaqForm({
      question: '',
      answer: '',
      category: 'booking',
      audience: 'ALL',
      order: faqs.length + 1,
      requiredCapability: '',
      isActive: true
    });
    setShowFaqModal(true);
  };

  const handleOpenEditFaq = (faq: any) => {
    setEditingFaq(faq);
    setFaqForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || 'booking',
      audience: faq.audience || 'ALL',
      order: faq.order || 0,
      requiredCapability: faq.requiredCapability || '',
      isActive: faq.isActive ?? true
    });
    setShowFaqModal(true);
  };

  const handleDuplicateFaq = async (faq: any) => {
    try {
      const payload = {
        question: `${faq.question} (نسخة مكررة)`,
        answer: faq.answer,
        category: faq.category,
        audience: faq.audience,
        order: faqs.length + 1,
        requiredCapability: faq.requiredCapability,
        isActive: true
      };
      const res = await fetch('/api/legal/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        if (showToast) showToast('تم تكرار السؤال بنجاح', 'success');
        loadFaqs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveFaq = async () => {
    try {
      const payload = { ...faqForm };
      let res;
      if (editingFaq) {
        res = await fetch(`/api/legal/faqs/${editingFaq.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/legal/faqs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setShowFaqModal(false);
        if (showToast) showToast('تم حفظ السؤال الشائع بنجاح!', 'success');
        loadFaqs();
      } else {
        const err = await res.json();
        if (showToast) showToast(err.error || 'فشل حفظ السؤال', 'error');
      }
    } catch (err: any) {
      if (showToast) showToast(err.message, 'error');
    }
  };

  const handleDeleteFaq = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا السؤال؟')) return;
    try {
      const res = await fetch(`/api/legal/faqs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (showToast) showToast('تم حذف السؤال بنجاح', 'success');
        loadFaqs();
      }
    } catch (err: any) {
      if (showToast) showToast(err.message, 'error');
    }
  };

  const handleToggleFaqActive = async (faq: any) => {
    try {
      const res = await fetch(`/api/legal/faqs/${faq.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...faq, isActive: !faq.isActive })
      });
      if (res.ok) {
        loadFaqs();
        if (showToast) showToast(!faq.isActive ? 'تم تفعيل السؤال' : 'تم تعطيل السؤال', 'success');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Sovereign Config Save
  const handleSaveSovereignConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/legal/sovereign-policy-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': '1',
          'x-user-role': 'admin'
        },
        body: JSON.stringify(sovereignConfig)
      });
      if (res.ok) {
        if (showToast) showToast('تم حفظ الضوابط والمهل السيادية لسياسات الحجز والدفع بنجاح! ⚖️', 'success');
      } else {
        const err = await res.json();
        if (showToast) showToast(err.error || 'فشل حفظ الإعدادات', 'error');
      }
    } catch (err: any) {
      if (showToast) showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Reset to seed defaults
  const handleResetDefaults = async () => {
    if (!window.confirm('هل أنت متأكد من استعادة المحتوى الافتراضي المعتمد للوثيقة؟')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/legal/seed-defaults', { method: 'POST' });
      if (res.ok) {
        if (showToast) showToast('تمت استعادة المحتوى الافتراضي بنجاح', 'success');
        if (['TERMS_AND_CONDITIONS', 'PRIVACY_POLICY', 'ABOUT_US'].includes(activeSubTab)) {
          loadDocument(activeSubTab);
        } else {
          loadFaqs();
        }
      }
    } catch (err: any) {
      if (showToast) showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filtered Sections
  const filteredSections = (currentDoc?.sections || []).filter((sec: any) => {
    if (!sectionSearchQuery) return true;
    const q = sectionSearchQuery.toLowerCase();
    const titleMatch = sec.title?.toLowerCase().includes(q);
    const contentMatch = sec.content?.toLowerCase().includes(q);
    const capMatch = sec.requiredCapability?.toLowerCase().includes(q);
    return titleMatch || contentMatch || capMatch;
  });

  // Filtered FAQs
  const filteredFaqs = faqs.filter(f => {
    const matchCat = faqCategoryFilter === 'ALL' || f.category === faqCategoryFilter;
    const matchAud = faqAudienceFilter === 'ALL' || f.audience === faqAudienceFilter || f.audience === 'ALL';
    const matchQuery = !faqSearchQuery ||
      f.question?.toLowerCase().includes(faqSearchQuery.toLowerCase()) ||
      f.answer?.toLowerCase().includes(faqSearchQuery.toLowerCase());
    return matchCat && matchAud && matchQuery;
  });

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Top Header & Sub-Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            نظام إدارة المحتوى القانوني والسياسات والأسئلة الشائعة (Dynamic Legal CMS)
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            محرر متقدم للبنود، استيراد ذكي من Word (.docx)، استهداف بالقدرات البرمجية، ومعاينة حية تطابق واجهة المنصة.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Import from Word Button */}
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-black text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300/80 rounded-2xl transition shadow-xs"
          >
            <Upload className="w-4 h-4 text-amber-700" />
            <span>استيراد من ملف وورد (.docx)</span>
          </button>

          {/* Live Preview Button */}
          <button
            onClick={() => setShowLivePreviewModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-black text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-2xl transition shadow-xs"
          >
            <Eye className="w-4 h-4 text-slate-600" />
            <span>معاينة حية للمستخدمين</span>
          </button>

          <button
            onClick={handleResetDefaults}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-2xl transition"
            title="استعادة المحتوى المعتمد الأصلي"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>استعادة الافتراضي</span>
          </button>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'TERMS_AND_CONDITIONS', label: 'الشروط والأحكام', icon: FileText, badge: currentDoc?.documentType === 'TERMS_AND_CONDITIONS' ? `v${currentDoc.version}` : '' },
          { id: 'PRIVACY_POLICY', label: 'سياسة الخصوصية', icon: Shield, badge: currentDoc?.documentType === 'PRIVACY_POLICY' ? `v${currentDoc.version}` : '' },
          { id: 'ABOUT_US', label: 'من نحن والتعريف بالمنصة', icon: Info, badge: '' },
          { id: 'FAQ', label: 'بنك الأسئلة الشائعة (FAQ)', icon: HelpCircle, badge: `${faqs.length} سؤال` },
          { id: 'SOVEREIGN_CONFIG', label: 'الضوابط والمهل السيادية للحجز والدفع (P1.9)', icon: Sliders, badge: '⚖️ سيادي' },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all ${
                isActive
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  isActive ? 'bg-amber-600 text-amber-50' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl border border-slate-200">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mb-2" />
          <span className="text-xs font-bold text-slate-500">جاري تحميل البيانات والمحتوى...</span>
        </div>
      ) : null}

      {/* 1️⃣ Documents Editor (Terms / Privacy / About) */}
      {!loading && ['TERMS_AND_CONDITIONS', 'PRIVACY_POLICY', 'ABOUT_US'].includes(activeSubTab) && currentDoc && (
        <div className="space-y-6">
          {/* Document Meta & Publish Bar */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-50/50 to-transparent p-5 rounded-3xl border border-amber-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-black text-slate-900">{currentDoc.title}</span>
                <span className="bg-amber-500 text-white text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full">
                  الإصدار: v{currentDoc.version}
                </span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  currentDoc.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {currentDoc.status === 'PUBLISHED' ? '✅ منشور ومعتمد' : '📝 مسودة قيد التعديل'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                آخر تحديث: {currentDoc.publishedAt ? new Date(currentDoc.publishedAt).toLocaleString('ar-SA') : 'لم ينشر بعد'}
                {currentDoc.changedBy ? ` • بواسطة: ${currentDoc.changedBy}` : ''}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowHistoryModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs"
              >
                <History className="w-3.5 h-3.5 text-slate-500" />
                سجل الإصدارات ({docHistory.length})
              </button>

              <button
                onClick={() => handleSaveDocument('DRAFT')}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition shadow-2xs"
              >
                <Save className="w-3.5 h-3.5" />
                حفظ كمسودة
              </button>

              <button
                onClick={() => handleSaveDocument('PUBLISHED')}
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                نشر فوري للإصدار (Publish)
              </button>
            </div>
          </div>

          {/* Change Summary Field */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-700">ملخص التعديل للإصدار (Change Summary)</label>
            <input
              type="text"
              value={changeSummary}
              onChange={e => setChangeSummary(e.target.value)}
              placeholder="مثال: تحديث البنود القانونية واستيراد الشروط المحدثة من Word v2.1"
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
            />
          </div>

          {/* Document Header Fields */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-4">
            <h5 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Info className="w-4 h-4 text-amber-500" />
              البيانات الرئيسية والمقدمة التعريفية
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عنوان الوثيقة</label>
                <input
                  type="text"
                  value={currentDoc.title || ''}
                  onChange={e => setCurrentDoc({ ...currentDoc, title: e.target.value })}
                  className="w-full p-2.5 text-xs font-bold rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">العنوان الفرعي</label>
                <input
                  type="text"
                  value={currentDoc.subtitle || ''}
                  onChange={e => setCurrentDoc({ ...currentDoc, subtitle: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم الإصدار (Version Tag)</label>
                <input
                  type="text"
                  value={currentDoc.version || ''}
                  onChange={e => setCurrentDoc({ ...currentDoc, version: e.target.value })}
                  className="w-full p-2.5 text-xs font-mono font-bold rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
                  placeholder="2.0.0"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">المقدمة والتمهيد القانوني</label>
              <textarea
                rows={3}
                value={currentDoc.introText || ''}
                onChange={e => setCurrentDoc({ ...currentDoc, introText: e.target.value })}
                className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:border-amber-500 outline-none leading-relaxed"
                placeholder="مقدمة تمهيدية تظهر في أعلى الصفحة للعملاء والشركاء..."
              />
            </div>
          </div>

          {/* Document Sections Manager */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
              <div>
                <h5 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-500" />
                  أقسام وبنود الوثيقة ({currentDoc.sections?.length || 0} بنود)
                </h5>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  يمكنك استهداف بنود معينة بالقدرات البرمجية لتظهر أو تختفي ديناميكياً وفق باقة المزود أو صفة العميل.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Search in sections */}
                <div className="relative">
                  <input
                    type="text"
                    value={sectionSearchQuery}
                    onChange={e => setSectionSearchQuery(e.target.value)}
                    placeholder="بحث في البنود..."
                    className="pr-8 pl-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:border-amber-500 outline-none w-44"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                </div>

                <button
                  onClick={handleOpenAddSection}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-black text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  إضافة بند جديد
                </button>
              </div>
            </div>

            {/* Sections List */}
            <div className="space-y-3">
              {filteredSections.map((section: any, idx: number) => {
                const originalIndex = (currentDoc.sections || []).findIndex((s: any) => s.id === section.id || s === section);
                return (
                  <div
                    key={section.id || idx}
                    className={`p-4 rounded-2xl border transition-all ${
                      section.isActive ? 'bg-slate-50/70 border-slate-200 hover:border-amber-300' : 'bg-slate-100/60 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                            {originalIndex + 1}
                          </span>
                          <h6 className="text-xs font-black text-slate-900">{section.title}</h6>
                          {section.requiredCapability && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full font-mono font-bold">
                              <Lock className="w-2.5 h-2.5" />
                              مشروط بالقدرة: {section.requiredCapability}
                            </span>
                          )}
                          {!section.isActive && (
                            <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full font-bold">
                              معطل
                            </span>
                          )}
                        </div>
                        <div
                          className="text-[11px] text-slate-600 line-clamp-2 mt-1 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-100"
                          dangerouslySetInnerHTML={{ __html: section.content || '<p>لا يوجد محتوى</p>' }}
                        />
                      </div>

                      {/* Section Action buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleSectionActive(originalIndex)}
                          className={`p-1.5 rounded-lg text-xs font-bold transition ${
                            section.isActive ? 'text-emerald-700 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-200'
                          }`}
                          title={section.isActive ? 'تعطيل البند' : 'تفعيل البند'}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMoveSection(originalIndex, 'up')}
                          disabled={originalIndex === 0}
                          className="p-1.5 text-slate-500 hover:text-slate-800 disabled:opacity-20 rounded-lg hover:bg-slate-200"
                          title="تحريك لأعلى"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveSection(originalIndex, 'down')}
                          disabled={originalIndex === (currentDoc.sections?.length || 0) - 1}
                          className="p-1.5 text-slate-500 hover:text-slate-800 disabled:opacity-20 rounded-lg hover:bg-slate-200"
                          title="تحريك لأسفل"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicateSection(originalIndex)}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"
                          title="نسخ وتكرار البند"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditSection(originalIndex)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="تعديل البند بالمحرر المتقدم"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSection(originalIndex)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                          title="حذف البند"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredSections.length === 0 && (
                <div className="text-center p-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                  لا توجد بنود مطابقة لبحثك. يمكنك الضغط على «إضافة بند جديد» أو «استيراد من Word».
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2️⃣ FAQ Manager */}
      {!loading && activeSubTab === 'FAQ' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Category Filter */}
              <span className="text-xs font-bold text-slate-700">التصنيف:</span>
              {['ALL', 'booking', 'pricing', 'cancellation', 'provider', 'general'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setFaqCategoryFilter(cat)}
                  className={`px-3 py-1 text-xs rounded-xl font-bold transition ${
                    faqCategoryFilter === cat ? 'bg-amber-500 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'ALL' ? 'الكل' : cat === 'booking' ? 'الحجوزات' : cat === 'pricing' ? 'الأسعار والرسوم' : cat === 'cancellation' ? 'الإلغاء والاسترداد' : cat === 'provider' ? 'المزودين' : 'عام'}
                </button>
              ))}

              <div className="w-[1px] h-4 bg-slate-300 mx-1" />

              {/* Audience Filter */}
              <span className="text-xs font-bold text-slate-700">الجمهور:</span>
              {['ALL', 'CUSTOMER', 'PROVIDER'].map(aud => (
                <button
                  key={aud}
                  onClick={() => setFaqAudienceFilter(aud)}
                  className={`px-2.5 py-1 text-xs rounded-xl font-bold transition ${
                    faqAudienceFilter === aud ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {aud === 'ALL' ? 'الجميع' : aud === 'CUSTOMER' ? 'العملاء' : 'الشركاء'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              <div className="relative flex-1 sm:w-52">
                <input
                  type="text"
                  value={faqSearchQuery}
                  onChange={e => setFaqSearchQuery(e.target.value)}
                  placeholder="بحث في الأسئلة..."
                  className="w-full pr-8 pl-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3" />
              </div>

              <button
                onClick={handleOpenAddFaq}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-black text-white bg-amber-500 hover:bg-amber-600 rounded-2xl shadow-xs"
              >
                <Plus className="w-4 h-4" />
                إضافة سؤال شائع جديد
              </button>
            </div>
          </div>

          {/* FAQ List */}
          <div className="grid grid-cols-1 gap-3">
            {filteredFaqs.map((faq) => (
              <div
                key={faq.id}
                className={`p-4 rounded-3xl border transition-all ${
                  faq.isActive ? 'bg-white border-slate-200 hover:border-amber-300 shadow-xs' : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <HelpCircle className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-black text-slate-900">{faq.question}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                        {faq.category === 'booking' ? 'حجوزات' : faq.category === 'pricing' ? 'أسعار' : faq.category === 'cancellation' ? 'إلغاء' : faq.category === 'provider' ? 'مزودين' : 'عام'}
                      </span>
                      <span className="text-[10px] bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-bold">
                        الجمهور: {faq.audience === 'ALL' ? 'الجميع' : faq.audience === 'CUSTOMER' ? 'العملاء' : 'الشركاء'}
                      </span>
                      {faq.requiredCapability && (
                        <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-mono">
                          قدرة: {faq.requiredCapability}
                        </span>
                      )}
                      {!faq.isActive && (
                        <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full font-bold">
                          معطل
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      {faq.answer}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleFaqActive(faq)}
                      className={`p-1.5 rounded-lg text-xs font-bold transition ${
                        faq.isActive ? 'text-emerald-700 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-200'
                      }`}
                      title={faq.isActive ? 'تعطيل السؤال' : 'تفعيل السؤال'}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDuplicateFaq(faq)}
                      className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"
                      title="تكرار السؤال"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEditFaq(faq)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="تعديل السؤال"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteFaq(faq.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                      title="حذف السؤال"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredFaqs.length === 0 && (
              <div className="text-center p-12 bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
                لا توجد أسئلة تطابق الفلتر الحالي.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3️⃣ Sovereign Booking & Payment Policy Settings (P1.9) */}
      {!loading && activeSubTab === 'SOVEREIGN_CONFIG' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-amber-500/15 via-amber-50 to-transparent p-6 rounded-3xl border border-amber-200/90 space-y-2">
            <h5 className="text-sm font-black text-amber-950 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-600" />
              الضوابط والمهل السيادية لسياسات الحجز والدفع (Platform Sovereign Policy Settings)
            </h5>
            <p className="text-xs text-amber-900/80 leading-relaxed">
              تحدد هذه الإعدادات المهل التشغيلية وحدود المحاولات المعتمدة سيادياً في منصة ليلة لجميع السياسات الأربع، والمهلة الافتراضية لمراجعة طلبات الحجز من قبل الشركاء.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-5">
            <h6 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              1. مهلة مراجعة طلب الحجز الافتراضية للمزود (Provider Response Deadline)
            </h6>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  المهلة السيادية الافتراضية للمنصة (بالساعات)
                </label>
                <select
                  value={sovereignConfig.defaultProviderReviewDeadlineHours}
                  onChange={e => setSovereignConfig({
                    ...sovereignConfig,
                    defaultProviderReviewDeadlineHours: Number(e.target.value)
                  })}
                  className="w-full p-2.5 text-xs font-bold rounded-xl border border-slate-200 focus:border-amber-500 outline-none bg-white"
                >
                  <option value={1}>ساعة واحدة (1h) — استجابة فائقة السرعة</option>
                  <option value={3}>3 ساعات (3h) — استجابة سريعة</option>
                  <option value={7}>7 ساعات (7h) — استجابة قياسية</option>
                  <option value={12}>12 ساعة (12h) — استجابة نصف يوم</option>
                  <option value={24}>24 ساعة (24h) — المهلة الافتراضية للمنصة</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  تطبق هذه المهلة على المزودين الذين لا يملكون استحقاق تخصيص المهلة في باقاتهم.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الخيارات المتاحة للمزودين المؤهلين (Allowed Deadline Options)
                </label>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-700">
                  [1, 3, 7, 12, 24] ساعة
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  يمكن للمزود المؤهل اختيار أحد هذه الخيارات فقط.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
            <h6 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              2. مهل سداد العميل لكل سياسة حجز ودفع (Customer Payment Deadlines)
            </h6>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. الموافقة قبل الدفع
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="72"
                    value={sovereignConfig.customerPaymentDeadlines?.APPROVAL_BEFORE_PAYMENT ?? 24}
                    onChange={e => setSovereignConfig({
                      ...sovereignConfig,
                      customerPaymentDeadlines: {
                        ...sovereignConfig.customerPaymentDeadlines,
                        APPROVAL_BEFORE_PAYMENT: Number(e.target.value)
                      }
                    })}
                    className="w-full p-2.5 text-xs font-bold rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
                  />
                  <span className="text-xs text-slate-500 font-bold">ساعة</span>
                </div>
                <span className="text-[10px] text-slate-400">بعد موافقة المزود</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. الدفع مع تعليق التأكيد
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="72"
                    value={sovereignConfig.customerPaymentDeadlines?.PAYMENT_BEFORE_APPROVAL ?? 24}
                    onChange={e => setSovereignConfig({
                      ...sovereignConfig,
                      customerPaymentDeadlines: {
                        ...sovereignConfig.customerPaymentDeadlines,
                        PAYMENT_BEFORE_APPROVAL: Number(e.target.value)
                      }
                    })}
                    className="w-full p-2.5 text-xs font-bold rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
                  />
                  <span className="text-xs text-slate-500 font-bold">ساعة</span>
                </div>
                <span className="text-[10px] text-slate-400">مدة احتجاز السداد</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  3. الحجز الفوري المؤكد
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={sovereignConfig.customerPaymentDeadlines?.INSTANT_CONFIRMATION ?? 2}
                    onChange={e => setSovereignConfig({
                      ...sovereignConfig,
                      customerPaymentDeadlines: {
                        ...sovereignConfig.customerPaymentDeadlines,
                        INSTANT_CONFIRMATION: Number(e.target.value)
                      }
                    })}
                    className="w-full p-2.5 text-xs font-bold rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
                  />
                  <span className="text-xs text-slate-500 font-bold">ساعة</span>
                </div>
                <span className="text-[10px] text-slate-400">مهلة إتمام الدفع الفوري</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  4. التفويض وحجز المبلغ
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="72"
                    value={sovereignConfig.customerPaymentDeadlines?.AUTHORIZE_THEN_CAPTURE ?? 24}
                    onChange={e => setSovereignConfig({
                      ...sovereignConfig,
                      customerPaymentDeadlines: {
                        ...sovereignConfig.customerPaymentDeadlines,
                        AUTHORIZE_THEN_CAPTURE: Number(e.target.value)
                      }
                    })}
                    className="w-full p-2.5 text-xs font-bold rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
                  />
                  <span className="text-xs text-slate-500 font-bold">ساعة</span>
                </div>
                <span className="text-[10px] text-slate-400">مدة صلاحية التفويض</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
            <h6 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-500" />
              3. أقصى عدد لمحاولات الدفع المسموحة (Max Payment Retry Attempts)
            </h6>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {['APPROVAL_BEFORE_PAYMENT', 'PAYMENT_BEFORE_APPROVAL', 'INSTANT_CONFIRMATION', 'AUTHORIZE_THEN_CAPTURE'].map(pol => (
                <div key={pol}>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {pol === 'APPROVAL_BEFORE_PAYMENT' ? 'الموافقة قبل الدفع' :
                     pol === 'PAYMENT_BEFORE_APPROVAL' ? 'الدفع مع تعليق التأكيد' :
                     pol === 'INSTANT_CONFIRMATION' ? 'الحجز الفوري' : 'التفويض والحجز'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={(sovereignConfig.maxPaymentAttempts as any)?.[pol] ?? 3}
                    onChange={e => setSovereignConfig({
                      ...sovereignConfig,
                      maxPaymentAttempts: {
                        ...sovereignConfig.maxPaymentAttempts,
                        [pol]: Number(e.target.value)
                      }
                    })}
                    className="w-full p-2.5 text-xs font-bold rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400">محاولات قبل الإلغاء الآلي</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveSovereignConfig}
              disabled={saving}
              className="flex items-center gap-2 px-7 py-3 text-xs font-black text-white bg-amber-500 hover:bg-amber-600 rounded-2xl transition shadow-md"
            >
              <Save className="w-4 h-4" />
              {saving ? 'جاري الحفظ...' : 'حفظ وتثبيت الضوابط السيادية'}
            </button>
          </div>
        </div>
      )}

      {/* 4️⃣ Section Edit/Add Modal with Advanced Rich Editor */}
      {showSectionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-3xl border border-slate-200 shadow-2xl p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h5 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-500" />
                <span>{editingSectionIndex !== null ? 'تعديل بند بالمحرر المتقدم' : 'إضافة بند جديد بالمحرر المتقدم'}</span>
              </h5>
              <button
                onClick={() => setShowSectionModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عنوان البند أو القسم</label>
                <input
                  type="text"
                  value={sectionForm.title}
                  onChange={e => setSectionForm({ ...sectionForm, title: e.target.value })}
                  className="w-full p-3 text-xs font-bold rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
                  placeholder="مثال: ضوابط الحجز الفوري وإلغاء الطلبات"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    القدرة البرمجية المشترطة لعرض البند (اختياري)
                  </label>
                  <input
                    type="text"
                    value={sectionForm.requiredCapability}
                    onChange={e => setSectionForm({ ...sectionForm, requiredCapability: e.target.value })}
                    className="w-full p-2.5 text-xs font-mono rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
                    placeholder="مثال: booking_policy.instant_confirmation"
                  />
                  <span className="text-[10px] text-slate-400">يظهر البند فقط عند تفعيل هذه القدرة في النظام/الباقة</span>
                </div>

                <div className="flex items-center gap-4 pt-6">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sectionForm.isActive}
                      onChange={e => setSectionForm({ ...sectionForm, isActive: e.target.checked })}
                      className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500"
                    />
                    <span>تفعيل وظهور هذا البند</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نص ومحتوى البند (المحرر المتقدم)</label>
                <AdvancedLegalEditor
                  value={sectionForm.content}
                  onChange={(val) => setSectionForm({ ...sectionForm, content: val })}
                  placeholder="اكتب أو نسق البند مع العناوين والتنبيهات والقوائم..."
                  minHeight="260px"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => setShowSectionModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveSection}
                className="px-6 py-2 text-xs font-black text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-xs"
              >
                حفظ البند
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5️⃣ FAQ Modal */}
      {showFaqModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-lg border border-slate-200 shadow-2xl p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h5 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-500" />
                <span>{editingFaq ? 'تعديل سؤال شائع' : 'إضافة سؤال شائع جديد'}</span>
              </h5>
              <button
                onClick={() => setShowFaqModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نص السؤال</label>
                <input
                  type="text"
                  value={faqForm.question}
                  onChange={e => setFaqForm({ ...faqForm, question: e.target.value })}
                  className="w-full p-2.5 text-xs font-bold rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
                  placeholder="مثال: ما هي مهلة الرد على طلبات الحجز المتاحة للمزودين؟"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نص الإجابة التفصيلية</label>
                <textarea
                  rows={4}
                  value={faqForm.answer}
                  onChange={e => setFaqForm({ ...faqForm, answer: e.target.value })}
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:border-amber-500 outline-none leading-relaxed"
                  placeholder="اكتب الإجابة المفصلة والشاملة..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">التصنيف</label>
                  <select
                    value={faqForm.category}
                    onChange={e => setFaqForm({ ...faqForm, category: e.target.value })}
                    className="w-full p-2.5 text-xs font-bold rounded-xl border border-slate-200 focus:border-amber-500 outline-none bg-white"
                  >
                    <option value="booking">حجوزات</option>
                    <option value="pricing">أسعار ورسوم</option>
                    <option value="cancellation">إلغاء واسترداد</option>
                    <option value="provider">مزودين وشركاء</option>
                    <option value="general">عام</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الجمهور المستهدف</label>
                  <select
                    value={faqForm.audience}
                    onChange={e => setFaqForm({ ...faqForm, audience: e.target.value })}
                    className="w-full p-2.5 text-xs font-bold rounded-xl border border-slate-200 focus:border-amber-500 outline-none bg-white"
                  >
                    <option value="ALL">الجميع (عام للعملاء والشركاء)</option>
                    <option value="CUSTOMER">العملاء فقط</option>
                    <option value="PROVIDER">الشركاء والمزودين فقط</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    القدرة المشترطة (اختياري)
                  </label>
                  <input
                    type="text"
                    value={faqForm.requiredCapability}
                    onChange={e => setFaqForm({ ...faqForm, requiredCapability: e.target.value })}
                    className="w-full p-2.5 text-xs font-mono rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
                    placeholder="booking_policy.instant_confirmation"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={faqForm.isActive}
                      onChange={e => setFaqForm({ ...faqForm, isActive: e.target.checked })}
                      className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500"
                    />
                    <span>تفعيل وظهور السؤال</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => setShowFaqModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveFaq}
                className="px-6 py-2 text-xs font-black text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-xs"
              >
                حفظ السؤال
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6️⃣ History Modal & Version Diff */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-2xl border border-slate-200 shadow-2xl p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h5 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-amber-500" />
                سجل إصدارات الوثيقة ({docHistory.length})
              </h5>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {docHistory.map((ver, i) => (
                <div key={ver.id || i} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xs text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                        v{ver.version}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ver.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ver.status === 'PUBLISHED' ? 'منشور' : 'مسودة'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {ver.publishedAt ? new Date(ver.publishedAt).toLocaleString('ar-SA') : 'مسودة'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 font-bold">
                    {ver.changeSummary || 'لا يوجد ملخص'}
                  </p>
                  <p className="text-[11px] text-slate-500 flex justify-between">
                    <span>بواسطة: {ver.changedBy || 'النظام'}</span>
                    <span>عدد البنود: {ver.sections?.length || 0}</span>
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-3">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-5 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7️⃣ Word Document Import Modal */}
      <WordImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        targetType={activeSubTab as any}
        onImportDocument={handleImportDocumentFromWord}
        onImportFaqs={handleImportFaqsFromWord}
      />

      {/* 8️⃣ Live Preview Simulation Modal */}
      <LegalLivePreviewModal
        isOpen={showLivePreviewModal}
        onClose={() => setShowLivePreviewModal(false)}
        documentData={currentDoc}
        faqsData={faqs}
        targetType={activeSubTab as any}
      />
    </div>
  );
}
