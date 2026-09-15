import React, { useState, useRef } from 'react';
import {
  Bold, Italic, Underline, List, ListOrdered, Heading2, Heading3,
  Quote, Link, AlignRight, AlignCenter, AlignLeft, Undo, Redo,
  AlertTriangle, ShieldAlert, CheckCircle2, Info, Maximize2, Minimize2,
  Code, Eye, Sparkles
} from 'lucide-react';

export interface AdvancedLegalEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  minHeight?: string;
  label?: string;
}

export default function AdvancedLegalEditor({
  value,
  onChange,
  placeholder = 'اكتب نص البند أو المادة القانونية هنا...',
  minHeight = '240px',
  label
}: AdvancedLegalEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'visual' | 'code' | 'preview'>('visual');
  const editorRef = useRef<HTMLDivElement>(null);

  const executeCommand = (command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertCalloutBox = (type: 'warning' | 'security' | 'success' | 'info') => {
    let calloutHtml = '';
    if (type === 'warning') {
      calloutHtml = `<div class="p-3 my-3 bg-amber-50 border-r-4 border-amber-500 rounded-lg text-amber-900 text-xs leading-relaxed font-bold flex items-start gap-2">⚠️ <strong>تنبيه إلزامي:</strong> اكتب نص الشرط أو التنبيه الإلزامي هنا...</div><p><br></p>`;
    } else if (type === 'security') {
      calloutHtml = `<div class="p-3 my-3 bg-purple-50 border-r-4 border-purple-600 rounded-lg text-purple-950 text-xs leading-relaxed font-bold flex items-start gap-2">🛡️ <strong>ضابط أمني وحوكمة:</strong> اكتب الشرط الأمني وضابط الرقابة هنا...</div><p><br></p>`;
    } else if (type === 'success') {
      calloutHtml = `<div class="p-3 my-3 bg-emerald-50 border-r-4 border-emerald-500 rounded-lg text-emerald-900 text-xs leading-relaxed font-bold flex items-start gap-2">✅ <strong>إعفاء أو ميزة:</strong> اكتب الميزة أو حالة الإعفاء الخاصة هنا...</div><p><br></p>`;
    } else {
      calloutHtml = `<div class="p-3 my-3 bg-blue-50 border-r-4 border-blue-500 rounded-lg text-blue-900 text-xs leading-relaxed font-bold flex items-start gap-2">ℹ️ <strong>ملاحظة إرشادية:</strong> اكتب التوجيه الإرشادي هنا...</div><p><br></p>`;
    }

    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand('insertHTML', false, calloutHtml);
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div
      className={`border border-slate-300 rounded-2xl bg-white transition-all overflow-hidden flex flex-col ${
        isFullscreen ? 'fixed inset-4 z-50 shadow-2xl border-amber-500' : 'relative'
      }`}
      dir="rtl"
    >
      {/* Top Toolbar */}
      <div className="bg-slate-50 border-b border-slate-200 p-2 flex flex-wrap items-center justify-between gap-1.5 select-none">
        {/* Formatting Actions */}
        <div className="flex items-center gap-1 flex-wrap">
          {label && (
            <span className="text-xs font-black text-slate-700 px-2 py-1 bg-white rounded-lg border border-slate-200 ml-1">
              {label}
            </span>
          )}

          <button
            type="button"
            onClick={() => executeCommand('bold')}
            className="p-1.5 text-slate-700 hover:bg-white hover:text-amber-600 rounded-lg border border-transparent hover:border-slate-200 transition"
            title="عريض (Bold)"
          >
            <Bold className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => executeCommand('italic')}
            className="p-1.5 text-slate-700 hover:bg-white hover:text-amber-600 rounded-lg border border-transparent hover:border-slate-200 transition"
            title="مائل (Italic)"
          >
            <Italic className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => executeCommand('underline')}
            className="p-1.5 text-slate-700 hover:bg-white hover:text-amber-600 rounded-lg border border-transparent hover:border-slate-200 transition"
            title="تسطير (Underline)"
          >
            <Underline className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-slate-300 mx-1" />

          <button
            type="button"
            onClick={() => executeCommand('formatBlock', '<h2>')}
            className="px-2 py-1 text-xs font-black text-slate-700 hover:bg-white hover:text-amber-600 rounded-lg border border-transparent hover:border-slate-200 transition flex items-center gap-0.5"
            title="عنوان رئيسي (H2)"
          >
            <Heading2 className="w-3.5 h-3.5" />
            <span>H2</span>
          </button>

          <button
            type="button"
            onClick={() => executeCommand('formatBlock', '<h3>')}
            className="px-2 py-1 text-xs font-black text-slate-700 hover:bg-white hover:text-amber-600 rounded-lg border border-transparent hover:border-slate-200 transition flex items-center gap-0.5"
            title="عنوان فرعي (H3)"
          >
            <Heading3 className="w-3.5 h-3.5" />
            <span>H3</span>
          </button>

          <button
            type="button"
            onClick={() => executeCommand('formatBlock', '<p>')}
            className="px-2 py-1 text-xs font-bold text-slate-700 hover:bg-white hover:text-amber-600 rounded-lg border border-transparent hover:border-slate-200 transition"
            title="فقرة عادية (Paragraph)"
          >
            P
          </button>

          <div className="w-[1px] h-4 bg-slate-300 mx-1" />

          <button
            type="button"
            onClick={() => executeCommand('insertUnorderedList')}
            className="p-1.5 text-slate-700 hover:bg-white hover:text-amber-600 rounded-lg border border-transparent hover:border-slate-200 transition"
            title="قائمة نقطية"
          >
            <List className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => executeCommand('insertOrderedList')}
            className="p-1.5 text-slate-700 hover:bg-white hover:text-amber-600 rounded-lg border border-transparent hover:border-slate-200 transition"
            title="قائمة مرقمة"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-slate-300 mx-1" />

          {/* Custom Callout Box Buttons */}
          <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => insertCalloutBox('warning')}
              className="px-2 py-1 text-[10px] font-black text-amber-800 bg-amber-100/90 hover:bg-amber-200 rounded-md transition flex items-center gap-1"
              title="إدراج تنبيه إلزامي"
            >
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              <span>تنبيه</span>
            </button>

            <button
              type="button"
              onClick={() => insertCalloutBox('security')}
              className="px-2 py-1 text-[10px] font-black text-purple-800 bg-purple-100/90 hover:bg-purple-200 rounded-md transition flex items-center gap-1"
              title="إدراج شرط أمني سيادي"
            >
              <ShieldAlert className="w-3 h-3 text-purple-600" />
              <span>أمني</span>
            </button>

            <button
              type="button"
              onClick={() => insertCalloutBox('info')}
              className="px-2 py-1 text-[10px] font-black text-blue-800 bg-blue-100/90 hover:bg-blue-200 rounded-md transition flex items-center gap-1"
              title="إدراج ملاحظة إرشادية"
            >
              <Info className="w-3 h-3 text-blue-600" />
              <span>إرشاد</span>
            </button>
          </div>
        </div>

        {/* View mode & Fullscreen Controls */}
        <div className="flex items-center gap-1.5">
          <div className="bg-slate-200/80 p-0.5 rounded-lg flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setViewMode('visual')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
                viewMode === 'visual' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              محرر مرئي
            </button>

            <button
              type="button"
              onClick={() => setViewMode('code')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition flex items-center gap-1 ${
                viewMode === 'code' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code className="w-3 h-3" />
              <span>HTML</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition flex items-center gap-1 ${
                viewMode === 'preview' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>معاينة</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-slate-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition"
            title={isFullscreen ? 'تصغير الشاشة' : 'شاشة كاملة'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 overflow-y-auto p-4 bg-white relative">
        {viewMode === 'visual' && (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            dangerouslySetInnerHTML={{ __html: value }}
            className="outline-none text-xs sm:text-sm text-slate-800 leading-relaxed min-h-[220px] prose prose-amber max-w-none focus:ring-0"
            style={{ minHeight }}
            dir="rtl"
            data-placeholder={placeholder}
          />
        )}

        {viewMode === 'code' && (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-full min-h-[220px] p-3 text-xs font-mono text-slate-800 bg-slate-900 text-amber-300 rounded-xl outline-none leading-relaxed resize-y"
            dir="ltr"
            style={{ minHeight }}
          />
        )}

        {viewMode === 'preview' && (
          <div
            className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed space-y-3 prose max-w-none"
            dangerouslySetInnerHTML={{ __html: value || '<p class="text-slate-400 italic">لا يوجد محتوى لمعاينته</p>' }}
            dir="rtl"
          />
        )}
      </div>

      {/* Bottom Status bar */}
      <div className="bg-slate-50 border-t border-slate-200 px-3 py-1.5 flex justify-between items-center text-[10px] text-slate-500 font-mono">
        <span>الأحرف: {value?.replace(/<[^>]*>?/gm, '').length || 0} • الكلمات: {value?.replace(/<[^>]*>?/gm, '').trim().split(/\s+/).filter(Boolean).length || 0}</span>
        <span className="flex items-center gap-1 text-emerald-600 font-bold">
          <Sparkles className="w-3 h-3" />
          تنسيق ليلة المعتمد
        </span>
      </div>
    </div>
  );
}
