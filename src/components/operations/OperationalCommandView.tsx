import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Terminal, 
  Command, 
  Play, 
  Clock, 
  Layers, 
  ExternalLink, 
  PlusCircle, 
  ShieldCheck, 
  Filter, 
  CheckCircle2, 
  AlertCircle,
  X,
  FileText,
  UserCheck,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import { 
  OperationalCase, 
  CommandDefinition, 
  CASE_TYPE_LABELS, 
  PRIORITY_LABELS, 
  STATUS_LABELS,
  OPERATIONAL_TEAMS,
  OpsTheme
} from './types';
import { getOperationsAuthHeaders } from '../../utils/permissionUtils';

interface OperationalCommandViewProps {
  commands: CommandDefinition[];
  cases: OperationalCase[];
  onSelectCase: (caseId: string) => void;
  onExecuteCommand: (commandId: string, caseId: string, payload?: any) => void;
  onCreateCase: (caseData: any) => void;
  theme?: OpsTheme;
}

export const OperationalCommandView: React.FC<OperationalCommandViewProps> = ({
  commands,
  cases,
  onSelectCase,
  onExecuteCommand,
  onCreateCase,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<{ cases: OperationalCase[]; nonCaseMatches: any[] }>({
    cases: [],
    nonCaseMatches: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [prefilledEntity, setPrefilledEntity] = useState<any>(null);

  // New Case Form state
  const [newCaseForm, setNewCaseForm] = useState({
    title: '',
    description: '',
    caseType: 'CROSS_DEPARTMENT_COORDINATION',
    sourceEntityType: 'Booking',
    sourceEntityId: '',
    priority: 'MEDIUM',
    assignedTeamId: 'SUPPORT',
    financialImpact: 0,
    customerImpact: 'MEDIUM'
  });

  useEffect(() => {
    handleSearch(searchTerm);
  }, [searchTerm]);

  const handleSearch = async (q: string) => {
    try {
      setIsLoading(true);
      const url = q.trim() ? `/api/operations/search?q=${encodeURIComponent(q.trim())}` : '/api/operations/search';
      const res = await fetch(url, {
        headers: getOperationsAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults({
          cases: data.cases || [],
          nonCaseMatches: data.nonCaseMatches || []
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModalForEntity = (entity: any) => {
    setPrefilledEntity(entity);
    setNewCaseForm({
      title: `متابعة تشغيلية: ${entity.title}`,
      description: `تم إنشاء هذه الحالة لمتابعة ${entity.type === 'Booking' ? 'الحجز' : 'القاعة'} ${entity.displayId}.`,
      caseType: entity.type === 'Booking' ? 'BOOKING_ATTENTION' : 'HALL_APPROVAL',
      sourceEntityType: entity.type,
      sourceEntityId: String(entity.id),
      priority: 'MEDIUM',
      assignedTeamId: entity.type === 'Booking' ? 'SUPPORT' : 'VERIFICATION',
      financialImpact: 0,
      customerImpact: 'MEDIUM'
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseForm.title || !newCaseForm.sourceEntityId) {
      alert('يرجى ملء كافة الحقول الأساسية');
      return;
    }
    onCreateCase(newCaseForm);
    setIsCreateModalOpen(false);
  };

  const filteredCommands = commands.filter(c => {
    if (selectedCategory !== 'ALL' && c.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col gap-6 animate-fade-in">
      {/* 9.1 Big Command & Search Bar */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-slate-700">
        <div className="max-w-3xl mx-auto text-center mb-5">
          <div className="inline-flex items-center gap-2 bg-amber-400/10 text-amber-400 px-3 py-1 rounded-full text-xs font-bold mb-3 border border-amber-400/20">
            <Terminal className="w-3.5 h-3.5" />
            <span>منظومة البحث والأوامر التشغيلية الشاملة</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black mb-2">
            الوصول السريع للحالات والسجلات وتنفيذ الأوامر
          </h2>
          <p className="text-xs md:text-sm text-slate-300">
            ابحث برقم الحالة OPS- أو رقم الحجز BKG- أو اسم العميل أو القاعة، أو استعرض الأوامر المسموحة.
          </p>
        </div>

        <div className="max-w-3xl mx-auto relative">
          <Search className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="w-full bg-slate-800/90 border border-slate-600 rounded-2xl pr-12 pl-4 py-3.5 text-sm md:text-base text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent shadow-inner"
            placeholder="مثال: OPS-26-0000000001 أو BKG-26-0000000001 أو اسم القاعة..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            autoFocus
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Suggestions Tags */}
        <div className="max-w-3xl mx-auto mt-3 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">اختصارات:</span>
            {['OPS-26', 'BKG-26', 'اعتماد', 'نزاع', 'سداد'].map(tag => (
              <button
                key={tag}
                onClick={() => setSearchTerm(tag)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-bold"
          >
            <PlusCircle className="w-4 h-4" />
            <span>إنشاء حالة تشغيلية جديدة</span>
          </button>
        </div>
      </section>

      {/* 9.2 Search Results Display */}
      {searchTerm && (
        <section className={`rounded-2xl p-5 border transition-colors ${
          isDark ? 'bg-slate-900/90 border-slate-800 shadow-md text-slate-100' : 'bg-white border-slate-200/80 shadow-xs text-slate-900'
        }`}>
          <div className={`flex items-center justify-between mb-4 pb-2 border-b ${
            isDark ? 'border-slate-800' : 'border-slate-100'
          }`}>
            <div className="flex items-center gap-2">
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>نتائج البحث التشغيلي</h3>
              <span className="text-xs text-slate-400 font-mono">
                ({searchResults.cases.length} حالات • {searchResults.nonCaseMatches.length} سجلات منصة)
              </span>
            </div>
            {isLoading && <span className="text-xs text-emerald-400 animate-pulse">جاري البحث...</span>}
          </div>

          {/* Cases Results */}
          <div className="space-y-2 mb-6">
            <div className={`text-xs font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>الحالات التشغيلية النشطة:</div>
            {searchResults.cases.length === 0 ? (
              <div className={`p-4 rounded-xl text-center text-xs ${
                isDark ? 'bg-slate-950/60 text-slate-400 border border-slate-800' : 'bg-slate-50 text-slate-400'
              }`}>
                لا توجد حالات تشغيلية مفتوحة تطابق "{searchTerm}"
              </div>
            ) : (
              searchResults.cases.map(c => {
                const priorityInfo = PRIORITY_LABELS[c.priority] || PRIORITY_LABELS.MEDIUM;
                const statusInfo = STATUS_LABELS[c.status] || STATUS_LABELS.NEW;
                const typeInfo = CASE_TYPE_LABELS[c.caseType] || { label: c.caseType, color: 'bg-slate-800 text-slate-300' };

                return (
                  <div
                    key={c.caseId}
                    onClick={() => onSelectCase(c.caseId)}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                      isDark 
                        ? 'bg-slate-950/60 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850' 
                        : 'border-slate-200 hover:border-primary/50 hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${priorityInfo.dot}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{c.caseId}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${statusInfo.badge}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <div className={`text-sm font-bold mt-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{c.title}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right text-xs text-slate-400">
                        <div>المسؤول: {c.assignedUserName || 'غير مسند'}</div>
                        <div className="text-[10px] font-mono">{new Date(c.dueAt).toLocaleDateString('ar-SA')}</div>
                      </div>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onSelectCase(c.caseId);
                        }}
                        className="px-3 py-1.5 bg-emerald-500 text-slate-950 rounded-lg text-xs font-black hover:bg-emerald-400 transition-colors"
                      >
                        فتح الحالة
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Non-Case Matches: Normal records in Laylah with NO active operational case */}
          {searchResults.nonCaseMatches.length > 0 && (
            <div className={`pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="text-xs font-bold text-teal-400 mb-2 flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                <span>سجلات عادية بالمنصة لا ترتبط بحالة تشغيلية مفتوحة:</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {searchResults.nonCaseMatches.map((nc, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border flex items-center justify-between ${
                      isDark 
                        ? 'bg-teal-950/20 border-teal-800/40 text-slate-200' 
                        : 'border-blue-200 bg-blue-50/30 text-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-xs font-bold ${isDark ? 'text-teal-300' : 'text-blue-800'}`}>{nc.displayId}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                          isDark ? 'bg-slate-900 text-slate-300 border-slate-700' : 'bg-white text-slate-600 border-slate-200'
                        }`}>
                          {nc.type === 'Booking' ? 'حجز مسجل' : 'قاعة ومنشأة'}
                        </span>
                      </div>
                      <div className={`text-sm font-bold mt-1 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{nc.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">الحالة الحالية: {nc.status}</div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <a
                        href={nc.dashboardUrl}
                        className={`flex items-center justify-center gap-1 px-3 py-1.5 border rounded-lg text-xs font-bold transition-colors ${
                          isDark 
                            ? 'bg-slate-850 hover:bg-slate-800 text-slate-200 border-slate-700' 
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span>فتح بالإدارة</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                      <button
                        onClick={() => openCreateModalForEntity(nc)}
                        className="flex items-center justify-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition-colors"
                      >
                        <PlusCircle className="w-3 h-3" />
                        <span>إنشاء حالة</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 10. Central Command Registry Explorer */}
      <section className={`rounded-2xl p-5 border transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800 shadow-md text-slate-100' : 'bg-white border-slate-200/80 shadow-xs text-slate-900'
      }`}>
        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b ${
          isDark ? 'border-slate-800' : 'border-slate-100'
        }`}>
          <div>
            <h3 className={`text-base font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Command className="w-4 h-4 text-amber-400" />
              <span>سجل الأوامر التشغيلية المعتمدة (Operational Commands)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              كتالوج العمليات والإجراءات الرسمية المسموح بتنفيذها على الحالات التشغيلية.
            </p>
          </div>

          {/* Category Filter */}
          <div className={`flex items-center gap-1.5 p-1 rounded-xl text-xs font-bold ${
            isDark ? 'bg-slate-950/80 border border-slate-800' : 'bg-slate-100'
          }`}>
            {[
              { id: 'ALL', label: 'الكل' },
              { id: 'LIFECYCLE', label: 'دورة الحياة' },
              { id: 'ASSIGNMENT', label: 'الإسناد والفرق' },
              { id: 'ESCALATION', label: 'التصعيد' },
              { id: 'COLLABORATION', label: 'الملاحظات والتعاون' },
              { id: 'VIEW', label: 'العرض والانتقال' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  selectedCategory === cat.id 
                    ? isDark ? 'bg-slate-800 text-white shadow-xs font-black' : 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Commands Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredCommands.map(cmd => (
            <div
              key={cmd.commandId}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                isDark 
                  ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700' 
                  : 'border-slate-200/90 bg-slate-50/40 hover:bg-slate-50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {cmd.commandId}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    cmd.confirmationLevel === 'SENSITIVE' ? 'bg-red-100 text-red-700' :
                    cmd.confirmationLevel === 'CONFIRM' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {cmd.confirmationLevel === 'SENSITIVE' ? 'إجراء حساس' : cmd.confirmationLevel === 'CONFIRM' ? 'يتطلب تأكيداً' : 'تنفيذ مباشر'}
                  </span>
                </div>

                <h4 className="font-bold text-slate-800 text-sm mb-1">{cmd.label}</h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">{cmd.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-mono text-[10px]">الصلاحية: {cmd.requiredPermission}</span>
                {cmd.reasonRequired && (
                  <span className="text-amber-600 font-semibold">• سبب إلزامي</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Manual Operational Case Creation Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" dir="rtl">
          <div className={`w-full max-w-xl rounded-2xl shadow-2xl border p-6 overflow-hidden ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`flex items-center justify-between pb-3 mb-4 border-b ${
              isDark ? 'border-slate-800' : 'border-slate-100'
            }`}>
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                <h3 className={`font-black text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>إنشاء حالة تشغيلية جديدة يدوياً</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>عنوان الحالة التشغيلية:</label>
                <input
                  type="text"
                  required
                  className={`w-full border rounded-xl p-2.5 focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-emerald-400' : 'border-slate-200 text-slate-800 focus:border-primary'
                  }`}
                  value={newCaseForm.title}
                  onChange={e => setNewCaseForm({ ...newCaseForm, title: e.target.value })}
                  placeholder="مثال: تعثر في التنسيق التشغيلي لحجز..."
                />
              </div>

              <div>
                <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>وصف الحالة وتفاصيل الاستثناء:</label>
                <textarea
                  required
                  rows={3}
                  className={`w-full border rounded-xl p-2.5 focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-emerald-400' : 'border-slate-200 text-slate-800 focus:border-primary'
                  }`}
                  value={newCaseForm.description}
                  onChange={e => setNewCaseForm({ ...newCaseForm, description: e.target.value })}
                  placeholder="اشرح طبيعة المشكلة والتدخل المطلوب من فريق العمليات..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>نوع الاستثناء:</label>
                  <select
                    className={`w-full border rounded-xl p-2.5 focus:outline-none ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'border-slate-200 text-slate-800'
                    }`}
                    value={newCaseForm.caseType}
                    onChange={e => setNewCaseForm({ ...newCaseForm, caseType: e.target.value })}
                  >
                    <option value="BOOKING_ATTENTION">حجز يحتاج تدخلاً</option>
                    <option value="HALL_APPROVAL">اعتماد قاعة ومنشأة</option>
                    <option value="SERVICE_APPROVAL">اعتماد خدمة مساندة</option>
                    <option value="FINANCIAL_DISPUTE">نزاع مالي وتشغيلي</option>
                    <option value="PAYMENT_FAILED">تعثر في السداد</option>
                    <option value="CROSS_DEPARTMENT_COORDINATION">تنسيق بين الإدارات</option>
                  </select>
                </div>

                <div>
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>الأولوية المبدئية:</label>
                  <select
                    className={`w-full border rounded-xl p-2.5 focus:outline-none ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'border-slate-200 text-slate-800'
                    }`}
                    value={newCaseForm.priority}
                    onChange={e => setNewCaseForm({ ...newCaseForm, priority: e.target.value })}
                  >
                    <option value="CRITICAL">حرجة (SLA 2 ساعات)</option>
                    <option value="HIGH">عالية (SLA 6 ساعات)</option>
                    <option value="MEDIUM">متوسطة (SLA 18 ساعة)</option>
                    <option value="LOW">منخفضة (SLA 48 ساعة)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>نوع الكيان المرتبط:</label>
                  <select
                    className={`w-full border rounded-xl p-2.5 focus:outline-none ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'border-slate-200 text-slate-800'
                    }`}
                    value={newCaseForm.sourceEntityType}
                    onChange={e => setNewCaseForm({ ...newCaseForm, sourceEntityType: e.target.value })}
                  >
                    <option value="Booking">حجز (Booking)</option>
                    <option value="Hall">قاعة (Hall)</option>
                    <option value="Service">خدمة (Service)</option>
                    <option value="SupportServiceRequest">طلب خدمة مساندة</option>
                    <option value="User">مستخدم/عميل</option>
                  </select>
                </div>

                <div>
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>معرف الكيان (ID):</label>
                  <input
                    type="text"
                    required
                    className={`w-full border rounded-xl p-2.5 font-mono focus:outline-none ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'border-slate-200 text-slate-800'
                    }`}
                    value={newCaseForm.sourceEntityId}
                    onChange={e => setNewCaseForm({ ...newCaseForm, sourceEntityId: e.target.value })}
                    placeholder="مثال: 104"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>الفريق المكلف بالمعالجة:</label>
                  <select
                    className={`w-full border rounded-xl p-2.5 focus:outline-none ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'border-slate-200 text-slate-800'
                    }`}
                    value={newCaseForm.assignedTeamId}
                    onChange={e => setNewCaseForm({ ...newCaseForm, assignedTeamId: e.target.value })}
                  >
                    {OPERATIONAL_TEAMS.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>الأثر المالي المتوقع (ر.س):</label>
                  <input
                    type="number"
                    className={`w-full border rounded-xl p-2.5 font-mono focus:outline-none ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'border-slate-200 text-slate-800'
                    }`}
                    value={newCaseForm.financialImpact}
                    onChange={e => setNewCaseForm({ ...newCaseForm, financialImpact: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className={`flex items-center justify-end gap-2 pt-4 border-t ${
                isDark ? 'border-slate-800' : 'border-slate-100'
              }`}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className={`px-4 py-2 rounded-xl font-bold transition-colors ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-black shadow-md transition-colors"
                >
                  حفظ وإنشاء الحالة التشغيلية
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
