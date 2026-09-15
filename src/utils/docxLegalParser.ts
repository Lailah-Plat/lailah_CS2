import mammoth from 'mammoth';

export interface ParsedLegalSection {
  id: string;
  title: string;
  content: string;
  order: number;
  requiredCapability?: string;
  isActive: boolean;
}

export interface ParsedFaqItem {
  id?: number | string;
  question: string;
  answer: string;
  category: string;
  audience: 'ALL' | 'CUSTOMER' | 'PROVIDER';
  order: number;
  requiredCapability?: string;
  isActive: boolean;
}

export interface DocxParseResult {
  title?: string;
  subtitle?: string;
  introText?: string;
  sections: ParsedLegalSection[];
  faqs: ParsedFaqItem[];
  rawText: string;
  rawHtml: string;
}

/**
 * Auto-detect system capabilities from Arabic keywords
 */
export function detectCapabilityFromText(text: string): string | undefined {
  if (!text) return undefined;
  const lower = text.toLowerCase();
  
  if (lower.includes('فوري') || lower.includes('تأكيد فوري') || lower.includes('instant')) {
    return 'booking_policy.instant_confirmation';
  }
  if (lower.includes('تفويض') || lower.includes('حجز المبلغ') || lower.includes('احتجاز') || lower.includes('capture') || lower.includes('hold')) {
    return 'booking_policy.authorize_then_capture';
  }
  if (lower.includes('مهلة') || lower.includes('24 ساعة') || lower.includes('استجابة المزود') || lower.includes('تخصيص المهلة')) {
    return 'booking_policy.custom_deadline';
  }
  if (lower.includes('تسعير ديناميكي') || lower.includes('ذروة') || lower.includes('surge') || lower.includes('مواسم')) {
    return 'pricing.dynamic_surge';
  }
  if (lower.includes('ويكند') || lower.includes('عطلة نهاية الأسبوع') || lower.includes('weekend')) {
    return 'pricing.weekend_differential';
  }
  if (lower.includes('متجر') || lower.includes('مستلزمات المكان') || lower.includes('addon') || lower.includes('منتجات الإضافة')) {
    return 'venue.addon_store';
  }
  if (lower.includes('دفع قبل الموافقة') || lower.includes('payment_before_approval')) {
    return 'booking_policy.payment_before_approval';
  }
  return undefined;
}

/**
 * Auto-detect FAQ category from text
 */
export function detectFaqCategory(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('إلغاء') || t.includes('استرداد') || t.includes('ترجيع') || t.includes('عربون') || t.includes('cancel') || t.includes('refund')) {
    return 'cancellation';
  }
  if (t.includes('سعر') || t.includes('مبلغ') || t.includes('رسوم') || t.includes('دفع') || t.includes('ضريبة') || t.includes('فاتورة') || t.includes('price') || t.includes('vat')) {
    return 'pricing';
  }
  if (t.includes('مزود') || t.includes('شريك') || t.includes('قاعة') || t.includes('منشأة') || t.includes('عمولة') || t.includes('provider') || t.includes('partner')) {
    return 'provider';
  }
  if (t.includes('حجز') || t.includes('موعد') || t.includes('تأكيد') || t.includes('تاريخ') || t.includes('booking')) {
    return 'booking';
  }
  return 'general';
}

/**
 * Auto-detect audience from text
 */
export function detectFaqAudience(text: string): 'ALL' | 'CUSTOMER' | 'PROVIDER' {
  const t = text.toLowerCase();
  if (t.includes('مزود') || t.includes('شريك') || t.includes('مالك القاعة') || t.includes('باقة اشتراك') || t.includes('لوحة تحكم المزود')) {
    return 'PROVIDER';
  }
  if (t.includes('عميل') || t.includes('ضيف') || t.includes('صاحب الحفل') || t.includes('طريقة الحجز')) {
    return 'CUSTOMER';
  }
  return 'ALL';
}

/**
 * Parse docx File using mammoth and extract structured sections and FAQs
 */
export async function parseDocxFile(file: File): Promise<DocxParseResult> {
  const arrayBuffer = await file.arrayBuffer();

  // Convert to HTML and Raw Text
  const [htmlResult, textResult] = await Promise.all([
    mammoth.convertToHtml({ arrayBuffer }),
    mammoth.extractRawText({ arrayBuffer })
  ]);

  const rawHtml = htmlResult.value;
  const rawText = textResult.value;

  // 1. Try parsing FAQs (Question ? followed by Answer)
  const faqs = parseFaqsFromTextAndHtml(rawText, rawHtml);

  // 2. Try parsing Document Sections (Articles, Clauses, Headings)
  const { title, subtitle, introText, sections } = parseSectionsFromHtmlAndText(rawHtml, rawText);

  return {
    title,
    subtitle,
    introText,
    sections,
    faqs,
    rawText,
    rawHtml
  };
}

/**
 * Parses FAQs by looking for questions (lines with '؟' or '?' or starting with س/سؤال/Q:)
 */
function parseFaqsFromTextAndHtml(rawText: string, rawHtml: string): ParsedFaqItem[] {
  const faqs: ParsedFaqItem[] = [];
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  let currentQuestion = '';
  let currentAnswerParts: string[] = [];

  const flushFaq = () => {
    if (currentQuestion && currentAnswerParts.length > 0) {
      const answer = currentAnswerParts.join('\n\n').trim();
      const combined = `${currentQuestion} ${answer}`;
      faqs.push({
        id: `faq_import_${Date.now()}_${faqs.length}`,
        question: cleanQuestionText(currentQuestion),
        answer,
        category: detectFaqCategory(combined),
        audience: detectFaqAudience(combined),
        order: faqs.length + 1,
        requiredCapability: detectCapabilityFromText(combined),
        isActive: true
      });
    }
    currentQuestion = '';
    currentAnswerParts = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line looks like a question
    const isQuestionMarker = /^(س[\d\s:.-]|سؤال[\s:.-]|Q[\d\s:.-]|س\/|\d+[-.)]\s*.+[؟?])/i.test(line);
    const hasQuestionMark = (line.includes('؟') || line.includes('?')) && line.length < 160;

    if (isQuestionMarker || hasQuestionMark) {
      flushFaq();
      currentQuestion = line;
    } else if (currentQuestion) {
      // It's answer content
      // Remove answer markers like "ج:" or "الإجابة:"
      const cleanLine = line.replace(/^(ج[\d\s:.-]|الإجابة[\s:.-]|A[\d\s:.-]|ج\/)\s*/i, '');
      currentAnswerParts.push(cleanLine);
    }
  }
  flushFaq();

  return faqs;
}

function cleanQuestionText(q: string): string {
  return q.replace(/^(س[\d\s:.-]|سؤال[\s:.-]|Q[\d\s:.-]|س\/|\d+[-.)]\s*)/i, '').trim();
}

/**
 * Parses Legal sections using HTML headings (<h1-6>) or Arabic Article markers (المادة / البند / الفصل)
 */
function parseSectionsFromHtmlAndText(rawHtml: string, rawText: string) {
  const sections: ParsedLegalSection[] = [];
  let title = '';
  let subtitle = '';
  let introText = '';

  // Use DOMParser if in browser environment
  if (typeof window !== 'undefined' && window.DOMParser) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, 'text/html');

    // Find main title from h1 or first heading
    const firstH1 = doc.querySelector('h1');
    if (firstH1 && firstH1.textContent) {
      title = firstH1.textContent.trim();
    }

    // Collect all headings and paragraphs
    const children = Array.from(doc.body.children);
    let currentSectionTitle = '';
    let currentSectionContent: string[] = [];
    let isHeaderIntro = true;

    const flushSection = () => {
      if (currentSectionTitle) {
        const fullContent = currentSectionContent.join('').trim() || '<p>لا يوجد محتوى</p>';
        const textOnly = currentSectionTitle + ' ' + fullContent.replace(/<[^>]*>?/gm, '');
        sections.push({
          id: `sec_imp_${Date.now()}_${sections.length}`,
          title: currentSectionTitle,
          content: fullContent,
          order: sections.length + 1,
          requiredCapability: detectCapabilityFromText(textOnly),
          isActive: true
        });
      }
      currentSectionTitle = '';
      currentSectionContent = [];
    };

    for (const el of children) {
      const tag = el.tagName.toLowerCase();
      const text = el.textContent?.trim() || '';

      if (!text) continue;

      const isHeading = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag);
      const isArticleClause = /^(المادة|البند|الفصل|أولاً|ثانياً|ثالثاً|رابعاً|خامساً|سادساً|سابعاً|ثامناً|تاسعاً|عاشراً|\d+[-.)]\s*)/.test(text);

      if (isHeading || isArticleClause) {
        if (isHeaderIntro && !title) {
          title = text;
          isHeaderIntro = false;
          continue;
        }
        isHeaderIntro = false;
        flushSection();
        currentSectionTitle = text;
      } else {
        if (isHeaderIntro) {
          if (!introText) {
            introText = text;
          } else {
            introText += '\n\n' + text;
          }
        } else {
          if (!currentSectionTitle) {
            currentSectionTitle = 'مقدمة البنود والأحكام العامة';
          }
          currentSectionContent.push(el.outerHTML);
        }
      }
    }
    flushSection();
  }

  // Fallback to text parsing if HTML parser returned few or no sections
  if (sections.length === 0) {
    const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let currentTitle = '';
    let currentContent: string[] = [];

    const flushTextSection = () => {
      if (currentTitle) {
        const fullContent = currentContent.map(c => `<p>${c}</p>`).join('');
        const textOnly = currentTitle + ' ' + currentContent.join(' ');
        sections.push({
          id: `sec_txt_${Date.now()}_${sections.length}`,
          title: currentTitle,
          content: fullContent || '<p>لا يوجد محتوى</p>',
          order: sections.length + 1,
          requiredCapability: detectCapabilityFromText(textOnly),
          isActive: true
        });
      }
      currentTitle = '';
      currentContent = [];
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isHeader = /^(المادة|البند|الفصل|أولاً|ثانياً|ثالثاً|رابعاً|خامساً|سادساً|سابعاً|ثامناً|تاسعاً|عاشراً|\d+[-.)]\s*)/.test(line) || (line.length < 80 && lines[i + 1] && lines[i + 1].length > 80);

      if (isHeader) {
        if (!title) {
          title = line;
          continue;
        }
        flushTextSection();
        currentTitle = line;
      } else {
        if (!currentTitle) {
          if (!introText) introText = line;
          else introText += '\n\n' + line;
        } else {
          currentContent.push(line);
        }
      }
    }
    flushTextSection();
  }

  return { title, subtitle, introText, sections };
}
