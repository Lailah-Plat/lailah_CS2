import React from 'react';

interface ProviderPackagesCatalogProps {
  catalogPackages: any[];
  setCatalogPackages: React.Dispatch<React.SetStateAction<any[]>>;
  showNotification: (type: string, message: string) => void;
  formatCurrency?: (val: number) => string;
}

export const ProviderPackagesCatalog: React.FC<ProviderPackagesCatalogProps> = ({
  catalogPackages,
  setCatalogPackages,
  showNotification,
  formatCurrency = (val: number) => typeof val === 'number' ? `${val.toLocaleString('ar-SA')} ر.س` : `${val || ''}`,
}) => {
  return (
    <div className="space-y-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
      <div className="flex justify-between items-center pb-3 border-b border-slate-50 dark:border-slate-800">
        <span className="text-[10px] font-black text-slate-400 font-mono">READY PACKAGES</span>
        <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">باقات المناسبات الجاهزة والمجمّعة</h3>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {catalogPackages.map((pkg) => (
          <div key={pkg.id} className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 hover:border-amber-100 transition-all space-y-3">
            <div className="flex justify-between items-center">
              <span className="bg-amber-50 text-amber-700 text-[10px] font-black px-2.5 py-1 rounded-full border border-amber-200">باقة كبرى</span>
              <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">{pkg.name}</h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{pkg.desc}</p>
            
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl space-y-2">
              <span className="text-[10px] font-black text-slate-400 block">المكونات المتضمنة بالباقة كلياً:</span>
              <div className="flex flex-wrap gap-1.5">
                {pkg.items.map((item: any, i: number) => (
                  <span key={i} className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-700">
                    ✓ {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-slate-800 text-xs">
              <span className="text-[10px] text-slate-400">القاعة الرئيسية: <strong className="text-slate-700 dark:text-slate-300">{pkg.venue}</strong></span>
              <span className="font-mono text-amber-600 font-black text-sm">{formatCurrency(pkg.price)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add package form */}
      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3 mt-4">
        <h4 className="text-xs font-black text-amber-700 dark:text-amber-400">تجميع وتركيب باقة جديدة مخصصة للمناسبات</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="اسم الباقة الجاهزة (مثال: باقة العروس الفضية)"
            id="new_pkg_name_input"
            className="p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-xs outline-none text-right text-slate-800 dark:text-slate-100"
          />
          <select
            id="new_pkg_venue_input"
            className="p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-xs outline-none text-right text-slate-800 dark:text-slate-100"
          >
            <option value="قاعة الأسطورة الكبرى">قاعة الأسطورة الكبرى</option>
            <option value="قاعة الملكية المذهلة">قاعة الملكية المذهلة</option>
          </select>
          <input
            type="number"
            placeholder="السعر الإجمالي للباقة (SAR)"
            id="new_pkg_price_input"
            className="p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-xs outline-none text-right font-mono text-slate-800 dark:text-slate-100"
          />
        </div>
        <input
          type="text"
          placeholder="وصف مميزات وتفاصيل العرض الشامل للباقة"
          id="new_pkg_desc_input"
          className="w-full p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-xs outline-none text-right text-slate-800 dark:text-slate-100"
        />

        <button
          type="button"
          onClick={() => {
            const name = (document.getElementById('new_pkg_name_input') as HTMLInputElement)?.value;
            const venue = (document.getElementById('new_pkg_venue_input') as HTMLSelectElement)?.value;
            const price = (document.getElementById('new_pkg_price_input') as HTMLInputElement)?.value;
            const desc = (document.getElementById('new_pkg_desc_input') as HTMLInputElement)?.value;

            if (!name || !price) {
              showNotification('warning', 'يرجى تحديد اسم الباقة وسعرها الإجمالي.');
              return;
            }

            const newPkg = {
              id: `PKG-${catalogPackages.length + 1}`,
              name,
              venue,
              price: parseInt(price),
              items: [venue, 'خدمة الضيافة والشاي', 'تصميم الكوشة الأساسية'],
              desc: desc || 'باقة مجمعة من الكتالوج بخصم ترويجي حصرى.'
            };

            setCatalogPackages([...catalogPackages, newPkg]);
            showNotification('success', `تم بناء وحفظ باقة المناسبات ${newPkg.name} بنجاح في نظام ERP وجاهزة للنشر.`);
            
            // Clear inputs
            (document.getElementById('new_pkg_name_input') as HTMLInputElement).value = '';
            (document.getElementById('new_pkg_price_input') as HTMLInputElement).value = '';
            (document.getElementById('new_pkg_desc_input') as HTMLInputElement).value = '';
          }}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95"
        >
          إنشاء وتجميع باقة المناسبات
        </button>
      </div>
    </div>
  );
};
