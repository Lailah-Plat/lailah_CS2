import React, { useState } from 'react';
import { ProviderHallsCatalog } from './halls/ProviderHallsCatalog';
import { ProviderServicesCatalog } from './services/ProviderServicesCatalog';
import { ProviderPackagesCatalog } from './packages/ProviderPackagesCatalog';

interface ProviderCatalogDomainProps {
  catalogHalls: any[];
  setCatalogHalls: React.Dispatch<React.SetStateAction<any[]>>;
  catalogServices: any[];
  setCatalogServices: React.Dispatch<React.SetStateAction<any[]>>;
  catalogPackages: any[];
  setCatalogPackages: React.Dispatch<React.SetStateAction<any[]>>;
  showNotification: (type: string, message: string) => void;
  setIsMediaGuideOpen?: (open: boolean) => void;
  showProviderToCustomers?: boolean;
  setOsTab?: (tab: any) => void;
  currentProviderName?: string;
  hasDynamicPricingAccess?: boolean;
  formatCurrency?: (val: number) => string;
}

export const ProviderCatalogDomain: React.FC<ProviderCatalogDomainProps> = ({
  catalogHalls,
  setCatalogHalls,
  catalogServices,
  setCatalogServices,
  catalogPackages,
  setCatalogPackages,
  showNotification,
  setIsMediaGuideOpen = () => {},
  showProviderToCustomers = true,
  setOsTab = () => {},
  currentProviderName,
  hasDynamicPricingAccess,
  formatCurrency,
}) => {
  const [catalogActiveInnerTab, setCatalogActiveInnerTab] = useState<'halls' | 'services' | 'packages'>('halls');

  return (
    <div className="space-y-6">
      {/* Catalog subtabs switcher */}
      <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex flex-wrap gap-1 w-fit border border-slate-200/60 dark:border-slate-700/60">
        <button
          type="button"
          onClick={() => setCatalogActiveInnerTab('halls')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            catalogActiveInnerTab === 'halls'
              ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          إدارة قاعات ومساحات المنشأة ({catalogHalls.length})
        </button>
        <button
          type="button"
          onClick={() => setCatalogActiveInnerTab('services')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            catalogActiveInnerTab === 'services'
              ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          الخدمات المستقلة والمساندة ({catalogServices.length})
        </button>
        <button
          type="button"
          onClick={() => setCatalogActiveInnerTab('packages')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            catalogActiveInnerTab === 'packages'
              ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          باقات المناسبات الجاهزة ({catalogPackages.length})
        </button>
      </div>

      {/* Halls view */}
      {catalogActiveInnerTab === 'halls' && (
        <ProviderHallsCatalog
          catalogHalls={catalogHalls}
          setCatalogHalls={setCatalogHalls}
          showNotification={showNotification}
          setIsMediaGuideOpen={setIsMediaGuideOpen}
          showProviderToCustomers={showProviderToCustomers}
          currentProviderName={currentProviderName}
          hasDynamicPricingAccess={hasDynamicPricingAccess}
          formatCurrency={formatCurrency}
        />
      )}

      {/* Services view */}
      {catalogActiveInnerTab === 'services' && (
        <ProviderServicesCatalog
          catalogServices={catalogServices}
          setCatalogServices={setCatalogServices}
          showNotification={showNotification}
          setIsMediaGuideOpen={setIsMediaGuideOpen}
          setOsTab={setOsTab}
          currentProviderName={currentProviderName}
          hasDynamicPricingAccess={hasDynamicPricingAccess}
          formatCurrency={formatCurrency}
        />
      )}

      {/* Packages view */}
      {catalogActiveInnerTab === 'packages' && (
        <ProviderPackagesCatalog
          catalogPackages={catalogPackages}
          setCatalogPackages={setCatalogPackages}
          showNotification={showNotification}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
};
