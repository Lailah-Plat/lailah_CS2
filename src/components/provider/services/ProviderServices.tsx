import React, { useState } from 'react';
import { ProviderOrdersHub } from './ProviderOrdersHub';
import { ServiceEditor } from './ServiceEditor';
import { ProviderServicesCatalog } from '../catalog/services/ProviderServicesCatalog';

interface ProviderServicesProps {
  catalogServices: any[];
  setCatalogServices: React.Dispatch<React.SetStateAction<any[]>>;
  mySupportRequests?: any[];
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  setIsMediaGuideOpen?: (open: boolean) => void;
  showProviderToCustomers?: boolean;
  currentProviderName?: string;
  formatCurrency?: (val: number) => string;
}

export const ProviderServices: React.FC<ProviderServicesProps> = (props) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'orders'>('catalog');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 w-fit">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'catalog'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          كتالوج الخدمات المساندة
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          طلبات الخدمات المستقلة (SRV-26)
        </button>
      </div>

      {activeTab === 'catalog' ? (
        <ProviderServicesCatalog
          catalogServices={props.catalogServices}
          setCatalogServices={props.setCatalogServices}
          showNotification={props.showNotification}
          setIsMediaGuideOpen={props.setIsMediaGuideOpen}
          currentProviderName={props.currentProviderName}
          formatCurrency={props.formatCurrency}
        />
      ) : (
        <ProviderOrdersHub
          mySupportRequests={props.mySupportRequests || []}
          showNotification={props.showNotification}
        />
      )}
    </div>
  );
};

export default ProviderServices;
