import React, { useState } from 'react';
import { QrCode, Copy, Check, Printer, X, Tag } from 'lucide-react';

export function ItemQrCodeButton({ item }: { item: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const barcodeData = item.sku || `SKU-${item.id || '001'}`;
  const payload = JSON.stringify({
    sku: barcodeData,
    name: item.name,
    type: item.itemType || 'general',
    supplier: item.supplier || ''
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center justify-center gap-1 mx-auto transition-all cursor-pointer"
        title="توليد ومعاينة رمز QR والباركود"
      >
        <QrCode className="w-3.5 h-3.5 text-indigo-600" />
        <span className="font-mono">{barcodeData}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in" dir="rtl">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-base">
                <Tag className="w-5 h-5" />
                <span>رمز التتبع والباركود للأصل</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center space-y-3 print:p-0">
              <div className="font-black text-slate-800 text-lg">{item.name}</div>
              <div className="text-xs text-slate-500 font-mono">SKU: {barcodeData}</div>

              {/* Simulated Printable Visual Barcode / QR Box */}
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-6 rounded-2xl flex flex-col items-center justify-center gap-3">
                <div className="w-36 h-36 bg-white p-3 rounded-xl border border-slate-200 shadow-inner flex flex-col items-center justify-center">
                  {/* High quality SVG QR graphic representation */}
                  <svg className="w-full h-full text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                    <rect x="0" y="0" width="30" height="30" />
                    <rect x="5" y="5" width="20" height="20" fill="white" />
                    <rect x="9" y="9" width="12" height="12" />

                    <rect x="70" y="0" width="30" height="30" />
                    <rect x="75" y="5" width="20" height="20" fill="white" />
                    <rect x="79" y="9" width="12" height="12" />

                    <rect x="0" y="70" width="30" height="30" />
                    <rect x="5" y="75" width="20" height="20" fill="white" />
                    <rect x="9" y="79" width="12" height="12" />

                    <rect x="38" y="10" width="10" height="20" />
                    <rect x="10" y="38" width="20" height="10" />
                    <rect x="40" y="40" width="20" height="20" />
                    <rect x="70" y="40" width="15" height="15" />
                    <rect x="40" y="70" width="15" height="15" />
                    <rect x="65" y="65" width="25" height="25" />
                  </svg>
                </div>

                {/* Simulated Barcode lines */}
                <div className="w-full bg-white p-2 rounded-lg border border-slate-100 flex justify-center items-center gap-1 h-12">
                  {[3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3, 2, 3, 8, 4].map((width, idx) => (
                    <div 
                      key={idx} 
                      className="bg-slate-900 h-full rounded-sm" 
                      style={{ width: `${width}px` }}
                    />
                  ))}
                </div>

                <div className="text-[10px] text-slate-400 font-mono">{barcodeData}</div>
              </div>

              <div className="text-xs text-slate-500 bg-amber-50 p-3 rounded-xl border border-amber-100">
                يمكن طباعة الملصق ولصقه على الكراسي، الطاولات، معدات الإضاءة أو مستلزمات الخدمة لمسحه عند التسليم والاستلام.
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleCopy}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'تم النسخ' : 'نسخ الترميز'}
              </button>

              <button
                onClick={handlePrint}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <Printer className="w-3.5 h-3.5" />
                طباعة الملصق
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
