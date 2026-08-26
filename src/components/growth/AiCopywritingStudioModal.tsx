import React, { useState } from 'react';
import { 
  Sparkles, Wand2, ShieldCheck, CheckCircle2, XCircle, AlertCircle, 
  Copy, Check, Edit3, Save, MessageSquare, Send, Eye, FileText, X
} from 'lucide-react';

interface AiCopywritingStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  showNotice: (type: 'success' | 'error', text: string) => void;
  onApplyCopy?: (copyText: string, campaignTitle: string) => void;
}

export const AiCopywritingStudioModal: React.FC<AiCopywritingStudioModalProps> = ({
  isOpen,
  onClose,
  showNotice,
  onApplyCopy
}) => {
  // Generation inputs
  const [occasionType, setOccasionType] = useState('أعراس وزفاف فاخر');
  const [adTone, setAdTone] = useState('ملكي وفاخر (Luxury)');
  const [targetPlatform, setTargetPlatform] = useState('سناب شات وإنستغرام ريلز');
  const [keyFeatures, setKeyFeatures] = useState('خصم 20%، ضيافة VIP مجانية، جناح خاص للعروس، إطلالة بانورامية');
  const [facilityName, setFacilityName] = useState('قصر اليمامة الكبرى للمناسبات');
  const [isGenerating, setIsGenerating] = useState(false);

  // Stored ad copy packages with moderation and supervisory control
  const [generatedAdCopies, setGeneratedAdCopies] = useState<any[]>([
    {
      id: 1,
      title: 'باقة الزفاف الملكي - صيف 2026',
      facilityName: 'قاعة اللؤلؤة الكبرى بالرياض',
      occasion: 'أعراس وزفاف فاخر',
      tone: 'ملكي وفاخر (Luxury)',
      platform: 'سناب شات وإنستغرام ريلز',
      headline: 'ليلة العمر تستحق فخامة تليق بك ✨ احجز موعدك الملكي الآن',
      hookText: 'هل تبحث عن القاعة التي ستتحدث عنها الرياض طويلاً؟',
      bodyCopy: 'في قاعة اللؤلؤة الكبرى، ننسج تفاصيل ليلتكم بأعلى معايير الفخامة والضيافة النجدية الأصيلة. خصم حصري 20% مع باقة ضيافة VIP وجناح ملكي مجاني عند حجز هذا الشهر.',
      cta: 'احجز زيارتك للمعاينة الآن واحصل على العرض',
      visualDirective: 'تصوير سينمائي أفقي 16:9 و 9:16 مع إضاءة دافئة لحركة الثريات الكريستالية ودخول العروس.',
      hashtags: '#أعراس_الرياض #قاعات_فخمة #ليلة_العمر #حفلات_زفاف',
      status: 'admin_approved', // 'ai_draft' | 'under_review' | 'admin_approved' | 'rejected_with_notes'
      reviewerName: 'الإدارة العامة لمنصة ليلة',
      auditNotes: 'النص متوافق تماماً مع ضوابط الإعلانات والأسعار الشاملة لضريبة القيمة المضافة.',
      lastModified: 'اليوم، 10:30 ص'
    },
    {
      id: 2,
      title: 'عرض المؤتمرات والشركات B2B',
      facilityName: 'مركز أطياف للمعارض والمؤتمرات',
      occasion: 'مؤتمرات وفعاليات شركات',
      tone: 'احترافي ومباشر (Corporate)',
      platform: 'جوجل سيرش ولينكد إن',
      headline: 'فعاليات مؤسسية استثنائية تعزز مكانة علامتك التجارية 💼',
      hookText: 'تنظيم المؤتمرات بأحدث التجهيزات الصوتية والبصرية الذكية',
      bodyCopy: 'قاعات مجهزة بأعلى التقنيات التفاعلية، حلول ترجمة فورية، وضيافة أعمال متميزة. استقبل ضيوفك في مساحات مرنة تسع حتى 1500 شخص.',
      cta: 'اطلب عرض الأسعار المؤسسي المباشر',
      visualDirective: 'لقطات سريعة لشاشات LED التفاعلية وطاولات الاجتماعات والوفود الرسمية.',
      hashtags: '#مؤتمرات_السعودية #تنظيم_معارض #فعاليات_الشركات #BusinessEvents',
      status: 'under_review',
      reviewerName: 'فريق تدقيق الوكالة',
      auditNotes: 'قيد المراجعة للتحقق من أرقام السعة القصوى مع إدارة المنشأة.',
      lastModified: 'اليوم، 09:15 ص'
    }
  ]);

  // Editing state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    setTimeout(() => {
      const newPackage = {
        id: Date.now(),
        title: `حملة ${occasionType} - ${facilityName}`,
        facilityName,
        occasion: occasionType,
        tone: adTone,
        platform: targetPlatform,
        headline: `فخامة تليق بمناسبتك في ${facilityName} ✨ عروض حصرية لفترة محدودة`,
        hookText: `المكان الأجمل لمناسبتك في الرياض ينتظرك بمواصفات لا تُنسى!`,
        bodyCopy: `استمتع بأرقى اللحظات في ${facilityName}. عروض استثنائية تشمل: ${keyFeatures}. احجز موعدك الآن واضمن أفضل تواريخ الموسم.`,
        cta: 'احجز الآن واحصل على العرض الحصري',
        visualDirective: 'مشاهد احترافية تبرز الإضاءات والديكور والضيافة مع انتقال سلس وسريع.',
        hashtags: '#قاعات_الرياض #مناسبات_المملكة #ليلة_استثنائية',
        status: 'ai_draft', // Starts in draft under agency supervision
        reviewerName: 'بانتظار تدقيق الوكالة والإدارة',
        auditNotes: 'مسودة مولّدة آلياً، تتطلب موافقة الوكالة والإدارة قبل النشر.',
        lastModified: 'الآن'
      };

      setGeneratedAdCopies(prev => [newPackage, ...prev]);
      setIsGenerating(false);
      showNotice('success', 'تم توليد مسودة الإعلان بنجاح! يرجى تدقيقها واعتمادها إدارياً قبل الإطلاق.');
    }, 1200);
  };

  const handleStartEdit = (copyItem: any) => {
    setEditingId(copyItem.id);
    setEditForm({ ...copyItem });
  };

  const handleSaveEdit = () => {
    if (!editForm) return;
    setGeneratedAdCopies(prev => prev.map(item => item.id === editForm.id ? { ...editForm, lastModified: 'تم التعديل الآن' } : item));
    setEditingId(null);
    setEditForm(null);
    showNotice('success', 'تم حفظ وتحديث مسودة الإعلان والملاحظات الرقابية بنجاح!');
  };

  const handleAdminApprove = (id: number) => {
    setGeneratedAdCopies(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'admin_approved',
          reviewerName: 'الإدارة العامة للرقابة والتسويق',
          auditNotes: 'معتمد رسمياً للنشر والبث المباشر في الحملات الإعلانية.',
          lastModified: 'الآن'
        };
      }
      return item;
    }));
    showNotice('success', 'تم اعتماد الإعلان رسمياً من قبل الإدارة!');
  };

  const handleAdminReject = (id: number) => {
    const reason = prompt('أدخل سبب الرفض أو ملاحظة التصحيح المطلوبة للوكالة:');
    if (reason === null) return;
    
    setGeneratedAdCopies(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'rejected_with_notes',
          reviewerName: 'فريق الرقابة الإدارية',
          auditNotes: reason || 'مرفوض لتعديل صياغة العرض وتصحيح التجاوزات.',
          lastModified: 'الآن'
        };
      }
      return item;
    }));
    showNotice('error', 'تم تسجيل ملاحظة التصحيح وتغيير حالة المسودة.');
  };

  const handleCopyText = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showNotice('success', 'تم نسخ النص إلى الحافظة!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in text-right" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-6 border border-slate-100">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-black flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
                مولّد الإعلانات والنصوص الذكي (AI Copywriter Studio)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                تحت رقابة وإشراف الإدارة والوكالة
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-900">
              توليد وتدقيق النصوص الإعلانية والخطافات الترويجية (Hooks & CTAs)
            </h3>
            <p className="text-xs text-slate-500">
              صياغة محتوى إعلاني عالي التحويل مخصص للقاعات والمناسبات السعودية مع مسار تدقيق صارم لمنع الأخطاء وتصحيح التجاوزات قبل النشر.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Generator Form */}
        <form onSubmit={handleGenerate} className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4 text-xs">
          <h4 className="font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>إعدادات التوليد الذكي</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">اسم القاعة أو المنشأة *</label>
              <input
                type="text"
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">نوع المناسبة والهدف *</label>
              <select
                value={occasionType}
                onChange={(e) => setOccasionType(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold"
              >
                <option value="أعراس وزفاف فاخر">أعراس وزفاف فاخر</option>
                <option value="حفلات تخرج واحتفالات">حفلات تخرج واحتفالات</option>
                <option value="مؤتمرات وفعاليات شركات">مؤتمرات وفعاليات شركات</option>
                <option value="خطوبة وملكة">خطوبة وملكة</option>
                <option value="مناسبات وعشاء عائلي">مناسبات وعشاء عائلي</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">نبرة الخطاب الإعلاني (Tone) *</label>
              <select
                value={adTone}
                onChange={(e) => setAdTone(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold"
              >
                <option value="ملكي وفاخر (Luxury)">ملكي وفاخر (Luxury)</option>
                <option value="حماسي وسريع (Punchy)">حماسي وسريع (Punchy)</option>
                <option value="توفيري وعروض حصرية (Promotional)">توفيري وعروض حصرية (Promotional)</option>
                <option value="رومانسي وعاطفي (Emotional)">رومانسي وعاطفي (Emotional)</option>
                <option value="احترافي ومباشر (Corporate)">احترافي ومباشر (Corporate)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">القناة الإعلانية المستهدفة *</label>
              <select
                value={targetPlatform}
                onChange={(e) => setTargetPlatform(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold"
              >
                <option value="سناب شات وإنستغرام ريلز">سناب شات وإنستغرام ريلز (Stories & Reels)</option>
                <option value="تيك توك للأعمال">تيك توك للأعمال (TikTok Ads)</option>
                <option value="جوجل سيرش ولينكد إن">جوجل سيرش ولينكد إن (Google Search & Maps)</option>
                <option value="رسائل SMS وواتساب ترويجية">رسائل SMS وواتساب ترويجية</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">المزايا والعرض الترويجي الحصري *</label>
              <input
                type="text"
                value={keyFeatures}
                onChange={(e) => setKeyFeatures(e.target.value)}
                placeholder="مثال: خصم 15%، ضيافة مجانية، بوفيه مفتوح..."
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isGenerating}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black transition-all cursor-pointer flex items-center gap-2 shadow-md disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGenerating ? 'جارِ الصياغة والتحليل الذكي...' : 'توليد حزمة إعلانية جديدة الآن'}</span>
            </button>
          </div>
        </form>

        {/* Generated Ad Copies List with Supervision Controls */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-600" />
              <span>المسودات والإعلانات المعتمدة ({generatedAdCopies.length})</span>
            </h4>
            <span className="text-xs text-slate-500">يتعين اعتماد الإعلان إدارياً قبل إدراجه في الحملة</span>
          </div>

          <div className="space-y-4">
            {generatedAdCopies.map((item) => (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition-all space-y-4 ${
                  item.status === 'admin_approved' 
                    ? 'bg-emerald-50/30 border-emerald-300' 
                    : item.status === 'rejected_with_notes' 
                    ? 'bg-rose-50/40 border-rose-200' 
                    : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                {/* Header info */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-extrabold text-slate-900 text-sm">{item.title}</h5>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                        item.status === 'admin_approved' 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                          : item.status === 'rejected_with_notes' 
                          ? 'bg-rose-100 text-rose-800 border-rose-200' 
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}>
                        {item.status === 'admin_approved' ? 'معتمد من الإدارة ✅' : item.status === 'rejected_with_notes' ? 'مرفوض مع ملاحظات ⚠️' : 'مسودة تحت التدقيق ⏳'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      القناة: <strong>{item.platform}</strong> | النبرة: <strong>{item.tone}</strong>
                    </p>
                  </div>

                  {/* Actions & Moderation controls */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {item.status !== 'admin_approved' && (
                      <button
                        onClick={() => handleAdminApprove(item.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>اعتماد رسمي</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleAdminReject(item.id)}
                      className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>تدقيق / ملاحظات</span>
                    </button>

                    <button
                      onClick={() => handleStartEdit(item)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل الصياغة</span>
                    </button>

                    {onApplyCopy && (
                      <button
                        onClick={() => {
                          onApplyCopy(`${item.headline}\n\n${item.bodyCopy}\n\nدعوة لاتخاذ إجراء: ${item.cta}`, item.title);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>تطبيق بالحملة</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Body Content */}
                {editingId === item.id ? (
                  /* Edit Mode */
                  <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">العنوان الرئيسي (Headline)</label>
                      <input
                        type="text"
                        value={editForm.headline}
                        onChange={(e) => setEditForm({ ...editForm, headline: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">نص الإعلان والعرض (Body Copy)</label>
                      <textarea
                        rows={3}
                        value={editForm.bodyCopy}
                        onChange={(e) => setEditForm({ ...editForm, bodyCopy: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">الدعوة لاتخاذ إجراء (CTA)</label>
                      <input
                        type="text"
                        value={editForm.cta}
                        onChange={(e) => setEditForm({ ...editForm, cta: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">ملاحظات التدقيق والرقابة الإدارية</label>
                      <input
                        type="text"
                        value={editForm.auditNotes}
                        onChange={(e) => setEditForm({ ...editForm, auditNotes: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-600"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold cursor-pointer"
                      >
                        إلغاء
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-black cursor-pointer shadow-xs"
                      >
                        حفظ التعديلات
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Display Mode */
                  <div className="space-y-3 text-xs text-slate-700">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <strong className="text-slate-900 block font-black">العنوان والخطاف (Headline & Hook):</strong>
                      <p className="text-indigo-900 font-bold text-sm">{item.headline}</p>
                      <p className="text-slate-500">{item.hookText}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <strong className="text-slate-900 block font-black">نص الإعلان والرسالة الترويجية:</strong>
                      <p className="text-slate-700 leading-relaxed">{item.bodyCopy}</p>
                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-emerald-700 font-bold">CTA: {item.cta}</span>
                        <button
                          onClick={() => handleCopyText(`${item.headline}\n\n${item.bodyCopy}\n\n${item.cta}`, item.id)}
                          className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedId === item.id ? 'تم النسخ!' : 'نسخ النص'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 text-[11px] space-y-1 text-slate-800">
                      <strong className="text-amber-950 font-black block">🎬 التوجيه الفني والسيناريو البصري (Storyboard):</strong>
                      <p className="text-slate-700">{item.visualDirective}</p>
                      <p className="text-slate-500 font-mono mt-1">{item.hashtags}</p>
                    </div>

                    {/* Audit & Compliance Footer */}
                    <div className="p-2.5 rounded-xl bg-slate-100/70 border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span><strong>المراجع:</strong> {item.reviewerName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">ملاحظات: {item.auditNotes}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
