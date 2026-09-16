import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Terminal, 
  ArrowRight, 
  AlertCircle, 
  Flame, 
  UserCheck, 
  Play, 
  CornerDownLeft, 
  ExternalLink, 
  Layers, 
  Clock, 
  FileText,
  X
} from 'lucide-react';
import { OperationalCase, CommandDefinition, PRIORITY_LABELS, CASE_TYPE_LABELS, OpsTheme } from './types';
import { getOperationsAuthHeaders } from '../../utils/permissionUtils';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCase: (caseId: string) => void;
  onExecuteCommand: (commandId: string, caseId?: string) => void;
  activeCase?: OperationalCase | null;
  commands: CommandDefinition[];
  theme?: OpsTheme;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onSelectCase,
  onExecuteCommand,
  activeCase,
  commands,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ cases: OperationalCase[]; nonCaseMatches: any[] }>({
    cases: [],
    nonCaseMatches: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
      fetchInitialResults();
    }
  }, [isOpen]);

  const fetchInitialResults = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/operations/search', {
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

  const handleSearch = async (q: string) => {
    setQuery(q);
    setSelectedIndex(0);
    if (!q.trim()) {
      fetchInitialResults();
      return;
    }
    try {
      setIsLoading(true);
      const res = await fetch(`/api/operations/search?q=${encodeURIComponent(q.trim())}`, {
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

  // Filter commands
  const filteredCommands = commands.filter(c => {
    if (!query) return true;
    const q = query.toLowerCase();
    return c.label.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.commandId.toLowerCase().includes(q);
  });

  const allItemsCount = searchResults.cases.length + searchResults.nonCaseMatches.length + (activeCase ? filteredCommands.length : 0);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, allItemsCount));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + allItemsCount) % Math.max(1, allItemsCount));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // Handle selection
      let currentIndex = 0;
      for (const opCase of searchResults.cases) {
        if (currentIndex === selectedIndex) {
          onSelectCase(opCase.caseId);
          onClose();
          return;
        }
        currentIndex++;
      }
      for (const nonCase of searchResults.nonCaseMatches) {
        if (currentIndex === selectedIndex) {
          window.location.href = nonCase.dashboardUrl;
          onClose();
          return;
        }
        currentIndex++;
      }
      if (activeCase) {
        for (const cmd of filteredCommands) {
          if (currentIndex === selectedIndex) {
            onExecuteCommand(cmd.commandId, activeCase.caseId);
            onClose();
            return;
          }
          currentIndex++;
        }
      }
    }
  };

  if (!isOpen) return null;

  let renderIndex = 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div 
        className={`w-full max-w-2xl rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[80vh] ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className={`p-4 border-b flex items-center gap-3 ${
          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/50 border-slate-100'
        }`}>
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className={`w-full bg-transparent text-lg focus:outline-none ${
              isDark ? 'text-white placeholder:text-slate-500' : 'text-slate-800 placeholder:text-slate-400'
            }`}
            placeholder="ابحث عن حالة OPS- أو حجز BKG- أو خدمة أو عميل، أو اكتب أمراً..."
            value={query}
            onChange={e => handleSearch(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button 
              onClick={() => handleSearch('')}
              className="p-1 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className={`text-xs px-2 py-1 rounded font-mono shrink-0 ${
            isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-600'
          }`}>
            ESC للإغلاق
          </span>
        </div>

        {/* Results Body */}
        <div className={`overflow-y-auto p-3 divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
          {/* Active Context Case Notice */}
          {activeCase && (
            <div className="pb-3 mb-2">
              <div className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-primary" />
                أوامر تشغيلية مباشرة للحالة النشطة:
                <span className="font-mono text-primary font-bold">{activeCase.caseId}</span>
              </div>
              <div className="space-y-1">
                {filteredCommands.slice(0, 4).map((cmd) => {
                  const itemIdx = renderIndex++;
                  const isSelected = selectedIndex === itemIdx;
                  return (
                    <div
                      key={cmd.commandId}
                      onClick={() => {
                        onExecuteCommand(cmd.commandId, activeCase.caseId);
                        onClose();
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Play className="w-4 h-4 text-primary" />
                        <div>
                          <div className="text-sm font-semibold">{cmd.label}</div>
                          <div className="text-xs text-slate-500">{cmd.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                        <span>تنفيذ</span>
                        <CornerDownLeft className="w-3 h-3" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cases Results */}
          <div className="py-2">
            <div className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center justify-between">
              <span>الحالات التشغيلية المطابقة ({searchResults.cases.length})</span>
              {isLoading && <span className="text-xs text-primary animate-pulse">جاري البحث...</span>}
            </div>

            {searchResults.cases.length === 0 && !isLoading && (
              <div className="py-4 text-center text-sm text-slate-400">
                لا توجد حالات تشغيلية مطابقة للبحث
              </div>
            )}

            <div className="space-y-1">
              {searchResults.cases.map(c => {
                const itemIdx = renderIndex++;
                const isSelected = selectedIndex === itemIdx;
                const priorityInfo = PRIORITY_LABELS[c.priority] || PRIORITY_LABELS.MEDIUM;
                const typeInfo = CASE_TYPE_LABELS[c.caseType] || { label: c.caseType, color: 'text-slate-700 bg-slate-100' };

                return (
                  <div
                    key={c.caseId}
                    onClick={() => {
                      onSelectCase(c.caseId);
                      onClose();
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                      isSelected ? 'bg-primary/10 border-primary/20' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${priorityInfo.dot}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">{c.caseId}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                        </div>
                        <div className="text-sm text-slate-800 font-medium line-clamp-1 mt-0.5">
                          {c.title}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{c.assignedUserName || 'غير مسند'}</span>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Non-Case Matches (Direct Bookings / Halls without an active case) */}
          {searchResults.nonCaseMatches.length > 0 && (
            <div className="pt-3">
              <div className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                سجلات بالمنصة لا تحتوي على حالة تشغيلية مفتوحة
              </div>
              <div className="space-y-1.5">
                {searchResults.nonCaseMatches.map((nc, idx) => {
                  const itemIdx = renderIndex++;
                  const isSelected = selectedIndex === itemIdx;
                  return (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border border-slate-200 flex items-center justify-between ${
                        isSelected ? 'bg-blue-50/50 border-blue-300' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-700">{nc.displayId}</span>
                          <span className="text-xs text-slate-500 font-medium">{nc.type === 'Booking' ? 'حجز مسجل' : 'قاعة/منشأة'}</span>
                        </div>
                        <div className="text-sm font-semibold text-slate-800">{nc.title}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={nc.dashboardUrl}
                          className="flex items-center gap-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                        >
                          <span>فتح بلوحة الإدارة</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ للتنقل</span>
            <span>↵ للاختيار</span>
            <span>ESC للخروج</span>
          </div>
          <div className="text-slate-400">
            مركز العمليات الموحد • منصة ليلة
          </div>
        </div>
      </div>
    </div>
  );
};
