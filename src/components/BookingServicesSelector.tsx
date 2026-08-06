import React, { useState, useEffect } from 'react';
import { Plus, Minus, Info, Check } from 'lucide-react';

interface BookingServicesSelectorProps {
  hallId: number;
  selectedServices: Array<{ serviceId: number, quantity: number, price: number, packageId?: string, selectedAddonIds?: string[] }>;
  onChange: (services: Array<{ serviceId: number, quantity: number, price: number, packageId?: string, selectedAddonIds?: string[] }>) => void;
}

export const BookingServicesSelector: React.FC<BookingServicesSelectorProps> = ({ hallId, selectedServices, onChange }) => {
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hallId) {
      setLoading(true);
      fetch(`/api/bookings/halls/${hallId}/services`)
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) setAvailableServices(data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [hallId]);

  const updateServiceSelection = (
    serviceId: number, 
    qty: number, 
    basePrice: number, 
    packageId?: string, 
    packagePrice?: number,
    selectedAddonIds: string[] = [],
    allAddons: any[] = []
  ) => {
    if (qty < 0) return;

    // Calculate effective price per unit = packagePrice (or basePrice) + sum(selected addons prices)
    const activeBase = packagePrice !== undefined ? packagePrice : basePrice;
    const addonsTotal = allAddons
      .filter(add => selectedAddonIds.includes(add.id))
      .reduce((sum, add) => sum + (Number(add.price) || 0), 0);
    const calculatedPrice = activeBase + addonsTotal;

    let updated = [...selectedServices];
    const existingIdx = selectedServices.findIndex(s => s.serviceId === serviceId);

    if (qty === 0) {
      updated = updated.filter(s => s.serviceId !== serviceId);
    } else {
      const payload = {
        serviceId,
        quantity: qty,
        price: calculatedPrice,
        packageId,
        selectedAddonIds
      };
      if (existingIdx > -1) {
        updated[existingIdx] = payload;
      } else {
        updated.push(payload);
      }
    }

    onChange(updated);
  };

  const parseJsonField = (field: any): any[] => {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    try {
      return JSON.parse(field);
    } catch {
      return [];
    }
  };

  if (!hallId) return null;

  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4 animate-in fade-in duration-150" dir="rtl">
      <h4 className="font-bold text-slate-800 text-sm mb-3">الخدمات الإضافية والذكية المتاحة للقاعة</h4>
      
      {loading && <div className="text-sm text-slate-500">جاري تحميل الخدمات...</div>}
      {!loading && availableServices.length === 0 && <div className="text-sm text-slate-500">لا توجد خدمات إضافية لهذه القاعة.</div>}
      
      <div className="space-y-4">
        {availableServices.map((service, index) => {
          const selected = selectedServices.find(s => s.serviceId === service.id);
          const qty = selected ? selected.quantity : 0;
          const currentPkgId = selected?.packageId || '';
          const currentAddonIds = selected?.selectedAddonIds || [];

          // Safe parsing of packages & addons
          const pkgs = parseJsonField(service.packages);
          const addonsList = parseJsonField(service.addons);

          // Find active pricing
          let activeBasePrice = Number(service.price) || 0;
          let activePkgName = '';
          if (currentPkgId && pkgs.length > 0) {
            const chosen = pkgs.find(p => p.id === currentPkgId);
            if (chosen) {
              activeBasePrice = Number(chosen.price) || 0;
              activePkgName = chosen.name;
            }
          }

          const sumOfAddons = addonsList
            .filter(a => currentAddonIds.includes(a.id))
            .reduce((sum, a) => sum + (Number(a.price) || 0), 0);

          const totalPricePerItem = activeBasePrice + sumOfAddons;

          return (
            <div key={index} className="bg-white p-4 rounded-2xl border border-slate-150 shadow-xs space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-black text-sm text-slate-800 flex items-center gap-1.5">
                    {service.name}
                    {service.taxonomyType && (
                      <span className="text-[9px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded-md font-bold">
                        {service.taxonomyType === 'rental' && 'تأجير'}
                        {service.taxonomyType === 'sales' && 'منتج استهلاكي'}
                        {service.taxonomyType === 'dynamic' && 'حسب الطلب'}
                      </span>
                    )}
                  </div>
                  {service.description && <div className="text-xs text-slate-500 mt-1">{service.description}</div>}
                  
                  <div className="text-xs font-bold text-slate-705 mt-2 flex items-center gap-2">
                    <span className="text-purple-600 font-extrabold text-xs">
                      السعر الفعلي للبند: {(totalPricePerItem).toLocaleString()} ر.س
                    </span>
                    {qty > 0 && (
                      <span className="text-[10px] text-slate-400 font-normal">
                        (إجمالي السلة: {(totalPricePerItem * qty).toLocaleString()} ر.س)
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3 shrink-0 mr-4">
                  <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                    <button 
                      type="button"
                      onClick={() => {
                        const nextQty = qty - 1;
                        const defaultPkg = pkgs[0];
                        updateServiceSelection(
                          service.id, 
                          nextQty, 
                          Number(service.price) || 0,
                          nextQty > 0 ? (currentPkgId || defaultPkg?.id) : undefined,
                          nextQty > 0 ? (currentPkgId ? activeBasePrice : defaultPkg?.price) : undefined,
                          nextQty > 0 ? currentAddonIds : [],
                          addonsList
                        );
                      }}
                      disabled={qty === 0}
                      className="p-2 hover:bg-slate-200 disabled:opacity-50 text-slate-600 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-bold text-sm">{qty}</span>
                    <button 
                      type="button"
                      onClick={() => {
                        const nextQty = qty + 1;
                        const defaultPkg = pkgs[0];
                        updateServiceSelection(
                          service.id, 
                          nextQty, 
                          Number(service.price) || 0,
                          currentPkgId || defaultPkg?.id,
                          currentPkgId ? activeBasePrice : defaultPkg?.price,
                          currentAddonIds,
                          addonsList
                        );
                      }}
                      disabled={service.quantity !== null && qty >= service.quantity}
                      className="p-2 hover:bg-slate-200 disabled:opacity-50 text-slate-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Show Packages Selection if qty > 0 and packages exist */}
              {qty > 0 && pkgs.length > 0 && (
                <div className="pt-2.5 border-t border-slate-100 space-y-1.5 bg-slate-50/50 p-2.5 rounded-xl">
                  <span className="block text-[10px] font-bold text-slate-550">تخصيص الباقة المطلوبة لهذه الخدمة:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {pkgs.map((pkg: any) => {
                      const isPkgChosen = currentPkgId === pkg.id;
                      return (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => {
                            updateServiceSelection(
                              service.id,
                              qty,
                              Number(service.price) || 0,
                              pkg.id,
                              pkg.price,
                              currentAddonIds,
                              addonsList
                            );
                          }}
                          className={`p-2 rounded-lg border text-right transition-all flex items-center justify-between ${
                            isPkgChosen ? 'bg-white border-purple-600 ring-2 ring-purple-100 shadow-xs' : 'bg-white/70 border-slate-200 hover:bg-slate-105'
                          }`}
                        >
                          <div>
                            <span className="text-xs font-bold block text-slate-800 text-right">{pkg.name}</span>
                            <span className="text-[9px] text-slate-400 font-normal leading-normal text-right block">{pkg.description}</span>
                          </div>
                          <span className="text-xs font-mono font-bold text-purple-700 shrink-0 mr-3">
                            {(pkg.price).toLocaleString()} ر.س
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Show Add-ons list if qty > 0 and addons exist */}
              {qty > 0 && addonsList.length > 0 && (
                <div className="pt-2.5 border-t border-slate-100 space-y-1.5 bg-slate-50/50 p-2.5 rounded-xl">
                  <span className="block text-[10px] font-bold text-slate-550 font-sans">تحديد الترقيات والإضافات الاختيارية (تفصيلي):</span>
                  <div className="flex flex-col gap-1.5">
                    {addonsList.map((addon: any) => {
                      const isAdded = currentAddonIds.includes(addon.id);
                      return (
                        <button
                          key={addon.id}
                          type="button"
                          onClick={() => {
                            let nextAddons = [...currentAddonIds];
                            if (isAdded) {
                              nextAddons = nextAddons.filter(id => id !== addon.id);
                            } else {
                              nextAddons.push(addon.id);
                            }
                            updateServiceSelection(
                              service.id,
                              qty,
                              Number(service.price) || 0,
                              currentPkgId || (pkgs[0]?.id),
                              currentPkgId ? activeBasePrice : (pkgs[0]?.price),
                              nextAddons,
                              addonsList
                            );
                          }}
                          className={`p-2 rounded-lg border text-right transition-all flex items-center justify-between ${
                            isAdded ? 'bg-emerald-50/40 border-emerald-500 shadow-xs' : 'bg-white/70 border-slate-250 hover:bg-slate-105'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                              isAdded ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-350'
                            }`}>
                              {isAdded && <span className="text-[10px] font-black leading-none">✓</span>}
                            </span>
                            <div>
                              <span className="text-xs font-bold block text-slate-800">{addon.name}</span>
                              <span className="text-[9px] text-slate-450 font-normal leading-normal block">{addon.description}</span>
                            </div>
                          </div>
                          <span className="text-xs font-mono font-black text-emerald-700 mr-3">
                            +{(addon.price).toLocaleString()} ر.س
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {selectedServices.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50/50 rounded-lg flex items-start gap-2 border border-blue-100">
          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs font-bold text-blue-700">تنبيه: يتم إضافة (سعر الخدمة والترقّية المختارة × الكمية) تلقائياً إلى السعر الإجمالي الكلي للحجز بشكل متوافق.</p>
        </div>
      )}
    </div>
  );
};
