import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />
  );
};

export const KpiSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <Skeleton className="h-8 w-32" />
          <div className="flex items-center space-x-2 space-x-reverse pt-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-8">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-5 gap-4 border-b border-slate-100 pb-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-4 w-24" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-5 gap-4 py-3 border-b border-slate-100 last:border-0 items-center">
            {[1, 2, 3, 4, 5].map((colIndex) => (
              <Skeleton key={colIndex} className="h-5 w-28" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const ChartSkeleton: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 mb-8">
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-48" />
        <div className="flex space-x-2 space-x-reverse">
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
      </div>
      <div className="h-64 flex items-end justify-between px-4 pb-2 pt-6 border-b border-r border-slate-100">
        {[40, 60, 25, 75, 45, 90, 50, 70, 30, 85, 60, 95].map((height, i) => (
          <div key={i} className="w-6 md:w-8 bg-slate-100 rounded-t-lg animate-pulse relative" style={{ height: `${height}%` }}>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-200/50 to-transparent opacity-50 rounded-t-lg" />
          </div>
        ))}
      </div>
      <div className="flex justify-between px-4 pt-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-3 w-12" />
        ))}
      </div>
    </div>
  );
};
