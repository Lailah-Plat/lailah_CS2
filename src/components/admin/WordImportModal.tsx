import React, { useState, useRef } from 'react';
import {
  FileText, Upload, Sparkles, CheckCircle2, AlertCircle, X,
  HelpCircle, Shield, List, RefreshCw, Eye, ArrowRight, Check,
  Sliders, Plus, Trash2, Tag, Layers
} from 'lucide-react';
import { parseDocxFile, DocxParseResult, ParsedLegalSection, ParsedFaqItem } from '../../utils/docxLegalParser';

export interface WordImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'TERMS_AND_CONDITIONS' | 'PRIVACY_POLICY' | 'ABOUT_US' | 'FAQ';
  onImportDocument: (data: {
    title?: string;
    subtitle?: string;
    introText?: string;
    sections: ParsedLegalSection[];
    mode: 'replace' | 'append';
  }) => void;
  onImportFaqs: (data: {
    faqs: ParsedFaqItem[];
    mode: 'replace' | 'append';
  }) => void;
}

export default function WordImportModal({
  isOpen,
  onClose,
  targetType,
  onImportDocument,
  onImportFaqs
}: WordImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState<DocxParseResult | null>(null);
  const [activeViewTab, setActiveViewTab] = useState<'sections' | 'faqs' | 'raw'>('sections');
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');

  // Staged Items Selection & Editing
  const [stagedSections, setStagedSections] = useState<ParsedLegalSection[]>([]);
  const [selectedSectionIds, setSelectedSectionIds] = useState<Set<string>>(new Set());
  const [stagedFaqs, setStagedFaqs] = useState<ParsedFaqItem[]>([]);
  const [selectedFaqIds, setSelectedFaqIds] = useState<Set<string | number>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.name.endsWith('.docx')) {
      processFile(droppedFile);
    }
  };

  const processFile = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setParsing(true);
    try {
      const result = await parseDocxFile(uploadedFile);
      setParseResult(result);
      setStagedSections(result.sections);
      setSelectedSectionIds(new Set(result.sections.map(s => s.id)));
      
      setStagedFaqs(result.faqs);
      setSelectedFaqIds(new Set(result.faqs.map(f => f.id || f.question)));

      // Auto switch active tab based on targetType
      if (targetType === 'FAQ') {
        setActiveViewTab('faqs');
      } else {
        setActiveViewTab('sections');
      }
    } catch (err) {
      console.error('Failed to parse docx file:', err);
      alert('حدث خطأ أثناء معالجة ملف Word. يرجى التأكد من أن صيغة الملف هي .docx صالحة.');
    } finally {
      setParsing(false);
    }
  };

  const handleToggleSection = (id: string) => {
    const next = new Set(selectedSectionIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedSectionIds(next);
  };

  const handleToggleAllSections = () => {
    if (selectedSectionIds.size === stagedSections.length) {
      setSelectedSectionIds(new Set());
    } else {
      setSelectedSectionIds(new Set(stagedSections.map(s => s.id)));
    }
  };

  const handleToggleFaq = (id: string | number) => {
    const next = new Set(selectedFaqIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedFaqIds(next);
  };

  const handleToggleAllFaqs = () => {
    if (selectedFaqIds.size === stagedFaqs.length) {
      setSelectedFaqIds(new Set());
    } else {
      setSelectedFaqIds(new Set(stagedFaqs.map(f => f.id || f.question)));
    }
  };

  const handleApplyImport = () => {
    if (!parseResult) return;

    if (activeViewTab === 'faqs' || targetType === 'FAQ') {
      const chosenFaqs = stagedFaqs.filter(f => selectedFaqIds.has(f.id || f.question));
      onImportFaqs({
        faqs: chosenFaqs,
        mode: importMode
      });
    } else {
      const chosenSections = stagedSections.filter(s => selectedSectionIds.has(s.id));
      onImportDocument({
        title: parseResult.title,
        subtitle: parseResult.subtitle,
        introText: parseResult.introText,
        sections: chosenSections,
        mode: importMode
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-4xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-50/40 to-transparent p-5 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                استيراد ذكي من ملف وورد (Word .docx)
                <span className="text-[11px] font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full font-mono">
                  {targetType === 'TERMS_AND_CONDITIONS' ? 'الشروط والأحكام' :
                   targetType === 'PRIVACY_POLICY' ? 'سياسة الخصوصية' :
                   targetType === 'ABOUT_US' ? 'من نحن' : 'الأسئلة الشائعة'}
                </span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                استخراج البنود والأسئلة تلقائياً ومطابقتها مع تنسيق منصة ليلة واكتشاف القدرات التشغيلية المرتبطة.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* File Upload Zone */}
          {!parseResult && !parsing && (
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/30 hover:bg-amber-50/60 rounded-3xl p-10 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-1">
                <FileText className="w-8 h-8" />
              </div>
              <h5 className="text-sm font-black text-slate-800">
                اسحب ملف الوورد (.docx) وأفلته هنا، أو اضغط للاختيار من جهازك
              </h5>
              <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                يدعم النظام ملفات Word الرسمية مع قراءة العناوين، البنود المرقمة (مثل 1.1، 1.2)، الفقرات، الجداول، والأسئلة الشائعة.
              </p>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                تحويل فوري إلى هيكل منصة ليلة المعتمد
              </span>
            </div>
          )}

          {/* Loading Indicator */}
          {parsing && (
            <div className="py-16 text-center space-y-3 bg-slate-50 rounded-2xl border border-slate-200">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
              <h6 className="text-sm font-black text-slate-800">جاري قراءة وتحليل ملف الوورد...</h6>
              <p className="text-xs text-slate-500">يتم استخراج العناوين والبنود والأسئلة ومطابقة التنسيقات</p>
            </div>
          )}

          {/* Parsed Result Staging View */}
          {parseResult && !parsing && (
            <div className="space-y-5">
              {/* File Info & Summary Banner */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900 flex items-center gap-2">
                      <span>الملف: {file?.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({Math.round((file?.size || 0) / 1024)} KB)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      تم استخراج {parseResult.sections.length} قسماً و {parseResult.faqs.length} سؤالاً شائعاً بنجاح.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setParseResult(null);
                      setFile(null);
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl"
                  >
                    اختيار ملف آخر
                  </button>
                </div>
              </div>

              {/* View Tabs & Import Mode Selector */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveViewTab('sections')}
                    className={`px-3 py-1.5 text-xs font-black rounded-xl transition flex items-center gap-1.5 ${
                      activeViewTab === 'sections'
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>البنود والأقسام ({stagedSections.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveViewTab('faqs')}
                    className={`px-3 py-1.5 text-xs font-black rounded-xl transition flex items-center gap-1.5 ${
                      activeViewTab === 'faqs'
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>الأسئلة الشائعة ({stagedFaqs.length})</span>
                  </button>
                </div>

                {/* Import Mode: Replace vs Append */}
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                  <span className="text-[11px] font-bold text-slate-600 pr-2">طريقة التطبيق:</span>
                  <button
                    type="button"
                    onClick={() => setImportMode('replace')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                      importMode === 'replace' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    استبدال المحتوى بالكامل
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode('append')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                      importMode === 'append' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    إضافة للمحتوى الحالي
                  </button>
                </div>
              </div>

              {/* Tab 1: Sections Preview */}
              {activeViewTab === 'sections' && (
                <div className="space-y-4">
                  {/* Title & Intro summary */}
                  {parseResult.title && (
                    <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 space-y-1">
                      <div className="text-xs font-black text-amber-900">
                        العنوان المستخرج: {parseResult.title}
                      </div>
                      {parseResult.introText && (
                        <p className="text-[11px] text-amber-800/80 line-clamp-2 leading-relaxed">
                          المقدمة: {parseResult.introText}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                    <span>اختر البنود المراد استيرادها:</span>
                    <button
                      onClick={handleToggleAllSections}
                      className="text-amber-600 hover:text-amber-700 underline text-xs"
                    >
                      {selectedSectionIds.size === stagedSections.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    {stagedSections.map((sec, idx) => {
                      const isSelected = selectedSectionIds.has(sec.id);
                      return (
                        <div
                          key={sec.id}
                          className={`p-3.5 rounded-2xl border transition-all ${
                            isSelected ? 'bg-white border-amber-300 shadow-xs' : 'bg-slate-50 border-slate-200 opacity-60'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSection(sec.id)}
                              className="mt-1 w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500"
                            />

                            <div className="flex-1 space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <input
                                  type="text"
                                  value={sec.title}
                                  onChange={e => {
                                    const updated = [...stagedSections];
                                    updated[idx].title = e.target.value;
                                    setStagedSections(updated);
                                  }}
                                  className="text-xs font-black text-slate-900 bg-transparent border-b border-transparent focus:border-amber-400 outline-none flex-1"
                                />

                                {sec.requiredCapability && (
                                  <span className="text-[10px] font-mono bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <Sparkles className="w-2.5 h-2.5 text-purple-500" />
                                    قدرة: {sec.requiredCapability}
                                  </span>
                                )}
                              </div>

                              <div
                                className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 max-h-24 overflow-y-auto prose max-w-none leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: sec.content }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {stagedSections.length === 0 && (
                      <div className="text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                        لم يتم العثور على أقسام هيكلية في ملف الوورد. يمكنك الانتقال لتبويب الأسئلة الشائعة.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: FAQs Preview */}
              {activeViewTab === 'faqs' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                    <span>اختر الأسئلة المراد استيرادها إلى بنك الأسئلة الشائعة:</span>
                    <button
                      onClick={handleToggleAllFaqs}
                      className="text-amber-600 hover:text-amber-700 underline text-xs"
                    >
                      {selectedFaqIds.size === stagedFaqs.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    {stagedFaqs.map((faq, idx) => {
                      const faqKey = faq.id || faq.question;
                      const isSelected = selectedFaqIds.has(faqKey);
                      return (
                        <div
                          key={faqKey}
                          className={`p-3.5 rounded-2xl border transition-all ${
                            isSelected ? 'bg-white border-amber-300 shadow-xs' : 'bg-slate-50 border-slate-200 opacity-60'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleFaq(faqKey)}
                              className="mt-1 w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500"
                            />

                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <input
                                  type="text"
                                  value={faq.question}
                                  onChange={e => {
                                    const updated = [...stagedFaqs];
                                    updated[idx].question = e.target.value;
                                    setStagedFaqs(updated);
                                  }}
                                  className="text-xs font-black text-slate-900 bg-transparent border-b border-transparent focus:border-amber-400 outline-none flex-1"
                                />

                                <select
                                  value={faq.category}
                                  onChange={e => {
                                    const updated = [...stagedFaqs];
                                    updated[idx].category = e.target.value;
                                    setStagedFaqs(updated);
                                  }}
                                  className="text-[10px] font-bold bg-slate-100 text-slate-700 rounded-md px-2 py-0.5 border border-slate-200 outline-none"
                                >
                                  <option value="booking">حجوزات</option>
                                  <option value="pricing">أسعار ورسوم</option>
                                  <option value="cancellation">إلغاء واسترداد</option>
                                  <option value="provider">مزودين وشركاء</option>
                                  <option value="general">عام</option>
                                </select>

                                <select
                                  value={faq.audience}
                                  onChange={e => {
                                    const updated = [...stagedFaqs];
                                    updated[idx].audience = e.target.value as any;
                                    setStagedFaqs(updated);
                                  }}
                                  className="text-[10px] font-bold bg-blue-50 text-blue-700 rounded-md px-2 py-0.5 border border-blue-200 outline-none"
                                >
                                  <option value="ALL">الجميع</option>
                                  <option value="CUSTOMER">العملاء فقط</option>
                                  <option value="PROVIDER">الشركاء فقط</option>
                                </select>
                              </div>

                              <textarea
                                rows={2}
                                value={faq.answer}
                                onChange={e => {
                                  const updated = [...stagedFaqs];
                                  updated[idx].answer = e.target.value;
                                  setStagedFaqs(updated);
                                }}
                                className="w-full text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200 outline-none leading-relaxed"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {stagedFaqs.length === 0 && (
                      <div className="text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                        لم يتم العثور على صيغ أسئلة وإجابات في الملف.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl"
          >
            إلغاء
          </button>

          {parseResult && (
            <button
              onClick={handleApplyImport}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-black text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>
                اعتماد واستيراد (
                {activeViewTab === 'faqs' || targetType === 'FAQ'
                  ? `${selectedFaqIds.size} أسئلة`
                  : `${selectedSectionIds.size} بنود`}
                )
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
