import React from 'react';
import { LayoutGrid, List as ListIcon, Table as TableIcon } from 'lucide-react';

export type ViewMode = 'grid' | 'list' | 'table';

interface ViewToggleProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export default function ViewToggle({ viewMode, setViewMode }: ViewToggleProps) {
  return (
    <div className="flex bg-white rounded-lg p-1 border border-slate-200">
      <button 
        onClick={() => setViewMode('grid')} 
        className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-amber-100 text-amber-700' : 'text-slate-400 hover:bg-slate-50'}`}
        title="العرض الشبكي"
      >
        <LayoutGrid className="w-5 h-5"/>
      </button>
      <button 
        onClick={() => setViewMode('list')} 
        className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-amber-100 text-amber-700' : 'text-slate-400 hover:bg-slate-50'}`}
        title="العرض القائمة"
      >
        <ListIcon className="w-5 h-5"/>
      </button>
      <button 
        onClick={() => setViewMode('table')} 
        className={`p-2 rounded transition-colors ${viewMode === 'table' ? 'bg-amber-100 text-amber-700' : 'text-slate-400 hover:bg-slate-50'}`}
        title="العرض الجدولي"
      >
        <TableIcon className="w-5 h-5"/>
      </button>
    </div>
  );
}
