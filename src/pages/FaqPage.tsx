import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { HelpCircle, Search, ChevronDown, ChevronUp, Sparkles, MessageCircle, Filter } from 'lucide-react';

interface FAQItemData {
  id: number;
  question: string;
  answer: string;
  category: string;
  audience: string;
  orderIndex?: number;
  isPublished?: boolean;
  requiredCapability?: string | null;
}

export default function FaqPage() {
  const [faqs, setFaqs] = useState<FAQItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [openItems, setOpenItems] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    fetch('/api/legal/faqs?audience=CUSTOMER')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setFaqs(data.data);
          // Open first two items by default
          if (data.data.length > 0) {
            setOpenItems({ [data.data[0].id]: true, ...(data.data[1] ? { [data.data[1].id]: true } : {}) });
          }
        }
      })
      .catch(err => {
        console.warn('Failed to load FAQs:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleItem = (id: number) => {
    setOpenItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const categories = ['ALL', ...Array.from(new Set(faqs.map(f => f.category).filter(Boolean)))];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'ALL' || faq.category === selectedCategory;
    const matchesSearch = !searchQuery ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col text-right" dir="rtl">
      <Header />
      
      {/* Top Banner */}
      <div className="bg-gradient-to-b from-blue-950 via-slate-900 to-slate-950 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>مركز المساعدة والإجابات السريعة</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            الأسئلة الشائعة والأكثر تكراراً
          </h1>
          
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            كل ما تود معرفته حول سياسات الحجز، الدفع، الإلغاء، والخدمات المساندة في منصة ليلة
          </p>

          {/* Search Box */}
          <div className="max-w-xl mx-auto pt-4 relative">
            <input
              type="text"
              placeholder="ابحث في الأسئلة الشائعة..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white text-slate-900 px-5 py-3.5 pr-12 rounded-2xl text-sm font-medium shadow-md border-0 focus:ring-2 focus:ring-amber-500 outline-none placeholder:text-slate-400"
            />
            <Search className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 mt-2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <main className="flex-grow max-w-4xl mx-auto px-4 md:px-6 w-full -mt-6 pb-20">
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200/80 space-y-6">
          
          {/* Category Filter Pills */}
          {categories.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1 ml-1">
                <Filter className="w-3.5 h-3.5" />
                التصنيف:
              </span>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                    selectedCategory === cat
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'ALL' ? 'جميع الأسئلة' : cat}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-slate-500">جاري تحميل بنك الأسئلة الشائعة...</p>
            </div>
          ) : filteredFaqs.length > 0 ? (
            <div className="space-y-3">
              {filteredFaqs.map(faq => {
                const isOpen = !!openItems[faq.id];
                return (
                  <div
                    key={faq.id}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isOpen ? 'border-amber-300 bg-amber-50/20 shadow-2xs' : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <button
                      onClick={() => toggleItem(faq.id)}
                      className="w-full flex items-center justify-between p-4 sm:p-5 text-right font-bold text-slate-900 text-sm sm:text-base gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-amber-500' : 'bg-slate-300'}`}></span>
                        <span>{faq.question}</span>
                      </div>
                      <div className={`p-1 rounded-full ${isOpen ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-slate-700 leading-relaxed text-sm whitespace-pre-wrap border-t border-amber-100/60">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-sm">لا توجد أسئلة تطابق بحثك حالياً</p>
              <p className="text-xs text-slate-400">جرب البحث بكلمات أخرى أو تصفح كل التصنيفات</p>
            </div>
          )}

          {/* Contact Support Card */}
          <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">لم تجد إجابة لسؤالك؟</h4>
              <p className="text-xs text-slate-500 mt-0.5">فريق خدمة العملاء متواجد للمساعدة على مدار الساعة</p>
            </div>
            <a
              href="/#contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold rounded-xl transition shadow-xs whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4 text-amber-400" />
              <span>تواصل مع الدعم الفني</span>
            </a>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
