import React, { useState } from 'react';
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Plus, 
  Star, 
  CheckCircle2, 
  FileText, 
  Search 
} from 'lucide-react';
import { formatCurrency } from '../../../utils/helpers';

interface Vendor {
  id: string;
  name: string;
  category: string;
  contactPerson: string;
  phone: string;
  rating: number;
  activeContractsCount: number;
  totalSpend: number;
  status: 'active' | 'suspended';
}

interface VendorListProps {
  vendors?: Vendor[];
  onAddVendor?: () => void;
}

export const VendorList: React.FC<VendorListProps> = ({
  vendors = [
    { id: 'VND-01', name: 'شركة التجهيزات الفندقية العالمية', category: 'تجهيزات ومعدات', contactPerson: 'أحمد السعيد', phone: '0501234567', rating: 4.9, activeContractsCount: 2, totalSpend: 48000, status: 'active' },
    { id: 'VND-02', name: 'مصنع المنسوجات الذهبية', category: 'مفارش وديكورات', contactPerson: 'سالم الشمري', phone: '0559876543', rating: 4.7, activeContractsCount: 1, totalSpend: 25000, status: 'active' },
    { id: 'VND-03', name: 'مؤسسة العود والبخور الملكي', category: 'معطرات وضيافة', contactPerson: 'عبدالعزيز القحطاني', phone: '0543322110', rating: 4.8, activeContractsCount: 3, totalSpend: 31000, status: 'active' },
  ],
  onAddVendor,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVendors = vendors.filter((v) =>
    v.name.includes(searchTerm) || v.category.includes(searchTerm) || v.contactPerson.includes(searchTerm)
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>سجل الموردين وشركاء التوريد المعتمدين ({filteredVendors.length})</span>
          </h3>
          <p className="text-[10px] text-slate-400">عقود الإمداد والخدمات المساندة للقاعات</p>
        </div>

        {onAddVendor && (
          <button
            onClick={onAddVendor}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة مورد</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {filteredVendors.map((vendor) => (
          <div
            key={vendor.id}
            className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-slate-400">{vendor.id}</span>
              <div className="flex items-center gap-1 text-amber-500 text-xs font-black">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>{vendor.rating}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">{vendor.name}</h4>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold block mt-0.5">{vendor.category}</span>
            </div>

            <div className="space-y-1 text-[11px] text-slate-500 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center justify-between">
                <span>المسؤول:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{vendor.contactPerson}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>الهاتف:</span>
                <span className="font-mono">{vendor.phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>إجمالي التعاملات:</span>
                <span className="font-mono font-black text-slate-800 dark:text-slate-200">{formatCurrency(vendor.totalSpend)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
