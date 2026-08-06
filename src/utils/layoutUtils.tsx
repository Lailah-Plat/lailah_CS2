import React from 'react';
import { Star } from 'lucide-react';
import { formatCurrency } from '../data/dashboardConstants';

export const renderPriceWithTax = (amount: number, isVatEnabled: boolean, className: string = "font-bold text-slate-800") => {
  return (
    <div className="flex flex-col items-start leading-tight">
      <span className={className}>{formatCurrency(amount)}</span>
      <span className={`text-[9px] font-bold ${isVatEnabled ? 'text-emerald-600' : 'text-amber-600'}`}>
        {isVatEnabled ? 'شامل الضريبة' : 'لا يوجد ضريبة (معفى)'}
      </span>
    </div>
  );
};

export const renderStars = (rating: number = 0, count: number = 0) => {
  return (
    <div className="flex items-center gap-1" title={`${rating} من 5 (${count} تقييم)`}>
      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
      <span className="text-sm font-bold text-slate-700">{rating.toFixed(1)}</span>
      <span className="text-xs text-slate-400">({count})</span>
    </div>
  );
};
