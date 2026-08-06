import React, { useState, useRef, useEffect } from 'react';
import { QrCode, X, Copy, Check, Download, Printer, Share2, ExternalLink, Sparkles } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

// Helper function to check if QR code feature is enabled globally
export function isQrCodeEnabled(): boolean {
  try {
    const stored = localStorage.getItem('SYSTEM_GENERAL_SETTINGS');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.enableQrCodes !== undefined) {
        return Boolean(parsed.enableQrCodes);
      }
    }
  } catch (e) {
    console.error('Error reading QR Code setting:', e);
  }
  return true; // Enabled by default
}

export interface QrItemProps {
  id: string | number;
  name?: string;
  title?: string;
  type?: 'hall' | 'service';
  provider?: string;
  providerName?: string;
  city?: string;
  category?: string;
  price?: number;
  image?: string;
  description?: string;
}

interface ItemQrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: QrItemProps | null;
}

export function ItemQrCodeModal({ isOpen, onClose, item }: ItemQrCodeModalProps) {
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !item) return null;

  const itemName = item.name || item.title || 'المرفق';
  const itemTypeLabel = item.type === 'service' ? 'خدمة مستقلة' : 'قاعة ومرفق';
  const provider = item.provider || item.providerName || 'مزود المنصة';

  // Build target URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://layla.app';
  const paramKey = item.type === 'service' ? 'serviceId' : 'hallId';
  const shareUrl = `${baseUrl}?${paramKey}=${item.id}&ref=qr`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPNG = () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;

    // Create higher res canvas with branding header
    const exportCanvas = document.createElement('canvas');
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    const padding = 40;
    const headerHeight = 100;
    const footerHeight = 80;
    const qrSize = 300;

    exportCanvas.width = qrSize + padding * 2;
    exportCanvas.height = qrSize + padding * 2 + headerHeight + footerHeight;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Header gradient line
    const gradient = ctx.createLinearGradient(0, 0, exportCanvas.width, 0);
    gradient.addColorStop(0, '#d97706');
    gradient.addColorStop(1, '#b45309');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, exportCanvas.width, 8);

    // Platform title
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('منصة ليلة - Layla Booking Platform', exportCanvas.width / 2, 45);

    // Item title
    ctx.fillStyle = '#d97706';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(itemName.length > 30 ? itemName.substring(0, 30) + '...' : itemName, exportCanvas.width / 2, 75);

    // Draw QR Code
    ctx.drawImage(canvas, padding, headerHeight + padding, qrSize, qrSize);

    // Footer instruction
    ctx.fillStyle = '#64748b';
    ctx.font = '13px sans-serif';
    ctx.fillText('امسح الكود بالهاتف للاستعراض والحجز المباشر', exportCanvas.width / 2, exportCanvas.height - 45);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText(`ID: ${item.id} | ${provider}`, exportCanvas.width / 2, exportCanvas.height - 20);

    const dataUrl = exportCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `QR_${item.type || 'item'}_${item.id}_${itemName.replace(/\s+/g, '_')}.png`;
    a.click();
  };

  const handlePrintPoster = () => {
    const printWindow = window.open('', '_blank', 'width=700,height=800');
    if (!printWindow) return;

    const canvas = canvasRef.current?.querySelector('canvas');
    const qrDataUrl = canvas ? canvas.toDataURL('image/png') : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <title>بطاقة QR - ${itemName}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 40px;
              background-color: #f8fafc;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .card {
              background: #ffffff;
              width: 100%;
              max-width: 480px;
              border-radius: 24px;
              border: 2px solid #e2e8f0;
              padding: 36px;
              text-align: center;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
            }
            .badge {
              display: inline-block;
              background: #fef3c7;
              color: #92400e;
              padding: 6px 16px;
              border-radius: 20px;
              font-size: 13px;
              font-weight: bold;
              margin-bottom: 12px;
            }
            .title {
              font-size: 24px;
              font-weight: 800;
              color: #0f172a;
              margin: 0 0 8px 0;
            }
            .subtitle {
              font-size: 14px;
              color: #64748b;
              margin-bottom: 24px;
            }
            .qr-container {
              background: #ffffff;
              border: 3px border-amber-500;
              padding: 20px;
              border-radius: 20px;
              display: inline-block;
              margin-bottom: 24px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.06);
            }
            .qr-container img {
              width: 220px;
              height: 220px;
              display: block;
            }
            .instructions {
              font-size: 15px;
              font-weight: 700;
              color: #1e293b;
              margin-bottom: 8px;
            }
            .sub-instructions {
              font-size: 12px;
              color: #94a3b8;
            }
            .footer {
              margin-top: 32px;
              padding-top: 20px;
              border-top: 1px solid #f1f5f9;
              font-size: 12px;
              color: #cbd5e1;
              display: flex;
              justify-content: space-between;
            }
            @media print {
              body { background: none; padding: 0; }
              .card { border: 1px solid #ccc; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">✨ منصة ليلة - ${itemTypeLabel}</div>
            <h1 class="title">${itemName}</h1>
            <div class="subtitle">المزود: ${provider} ${item.city ? `• ${item.city}` : ''}</div>
            <div class="qr-container">
              <img src="${qrDataUrl}" alt="QR Code" />
            </div>
            <div class="instructions">📱 امسح رمز الاستجابة السريعة للكاميرا</div>
            <div class="sub-instructions">للوصول المباشر لصفحة التفاصيل واستكمال حجزك بسهولة وسرعة</div>
            <div class="footer">
              <span>رقم التعريف: #${item.id}</span>
              <span>www.layla.app</span>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleShareWhatsApp = () => {
    const text = `استعرض وقُم بالحجز المباشر لـ "${itemName}" عبر منصة ليلة:\n${shareUrl}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const handleWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: itemName,
          text: `تفاصيل وحجز ${itemName} على منصة ليلة`,
          url: shareUrl,
        });
      } catch (err) {
        console.warn('Share cancelled or failed', err);
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden text-right font-sans relative">
        {/* Header bar */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-snug">رمز الاستجابة السريعة (QR Code)</h3>
              <p className="text-xs text-amber-100 font-medium">{itemTypeLabel}: {itemName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content area */}
        <div className="p-6 space-y-6">
          {/* Item details card */}
          <div className="bg-amber-50/50 p-3.5 rounded-2xl border border-amber-100/80 flex items-center gap-3">
            {item.image && (
              <img src={item.image} alt={itemName} className="w-12 h-12 rounded-xl object-cover border border-amber-200" />
            )}
            <div className="min-w-0 flex-1">
              <h4 className="font-extrabold text-slate-800 text-sm truncate">{itemName}</h4>
              <p className="text-xs text-slate-500 font-medium truncate">المزود: {provider} {item.city ? `• ${item.city}` : ''}</p>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center pt-2">
            <div
              ref={canvasRef}
              className="bg-white p-4 rounded-2xl border-2 border-amber-500/30 shadow-lg shadow-amber-500/5 relative group cursor-pointer hover:border-amber-500 transition-all"
              onClick={handleCopyLink}
              title="انقر لنسخ الرابط"
            >
              <QRCodeCanvas
                value={shareUrl}
                size={210}
                level="H"
                includeMargin={true}
                imageSettings={{
                  src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23d97706'><path d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'/></svg>",
                  x: undefined,
                  y: undefined,
                  height: 32,
                  width: 32,
                  excavate: true,
                }}
              />
              <div className="absolute inset-0 bg-amber-900/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                <span className="bg-slate-900/80 text-white text-xs font-bold px-3 py-1.5 rounded-lg backdrop-blur-xs flex items-center gap-1.5">
                  <Copy className="w-3.5 h-3.5" />
                  نسخ الرابط
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-3 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              امسح الكود بالكاميرا للوصول المباشر والحجز
            </p>
          </div>

          {/* Share URL input */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-700 block">رابط المشاركة المباشر:</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-600 font-mono text-left dir-ltr truncate outline-none"
              />
              <button
                onClick={handleCopyLink}
                className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-900 text-white shadow-sm'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    تم النسخ!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    نسخ
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Action buttons grid */}
          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
            <button
              onClick={handleDownloadPNG}
              className="w-full py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-600" />
              تحميل PNG
            </button>

            <button
              onClick={handlePrintPoster}
              className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              طباعة بوستر / كرت
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-emerald-600" />
              مشاركة واتساب
            </button>

            <button
              onClick={handleWebShare}
              className="w-full py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-indigo-600" />
              مشاركة بالنظام
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact Button trigger for QR code
export function ItemQrCodeButton({
  item,
  variant = 'default',
  className = '',
}: {
  item: QrItemProps;
  variant?: 'default' | 'icon' | 'badge' | 'table';
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const enabled = isQrCodeEnabled();

  if (!enabled) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(true);
  };

  return (
    <>
      {variant === 'icon' ? (
        <button
          onClick={handleClick}
          title="رمز الاستجابة السريعة QR Code"
          className={`p-2 rounded-xl bg-white/90 backdrop-blur-xs text-amber-600 hover:bg-amber-50 hover:text-amber-700 shadow-xs border border-slate-200/80 transition-all cursor-pointer ${className}`}
        >
          <QrCode className="w-4 h-4" />
        </button>
      ) : variant === 'badge' ? (
        <button
          onClick={handleClick}
          className={`px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/80 text-[11px] font-extrabold flex items-center gap-1 transition-all cursor-pointer ${className}`}
        >
          <QrCode className="w-3.5 h-3.5 text-amber-600" />
          <span>رمز QR</span>
        </button>
      ) : variant === 'table' ? (
        <button
          onClick={handleClick}
          title="رمز QR للمشاركة والتصدير"
          className={`p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/80 transition-all cursor-pointer ${className}`}
        >
          <QrCode className="w-3.5 h-3.5" />
        </button>
      ) : (
        <button
          onClick={handleClick}
          className={`px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 hover:border-amber-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${className}`}
        >
          <QrCode className="w-3.5 h-3.5 text-amber-600" />
          <span>رمز QR</span>
        </button>
      )}

      <ItemQrCodeModal isOpen={isOpen} onClose={() => setIsOpen(false)} item={item} />
    </>
  );
}
