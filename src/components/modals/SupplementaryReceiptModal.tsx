import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SupplementaryReceiptVoucher } from '../../types/index.js';
import { 
  FileText, 
  Printer, 
  X, 
  CheckCircle2, 
  Building2, 
  Calendar, 
  Receipt, 
  ShieldCheck, 
  ShoppingBag, 
  Share2, 
  BellRing,
  Send,
  MessageSquare
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface SupplementaryReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  voucher: SupplementaryReceiptVoucher | null;
}

export const SupplementaryReceiptModal: React.FC<SupplementaryReceiptModalProps> = ({
  isOpen,
  onClose,
  voucher
}) => {
  if (!isOpen || !voucher) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `سند قبض ملحق #${voucher.voucherNumber}`,
        text: `سند قبض ملحق بحجز #${voucher.bookingNumber} بمبلغ ${voucher.totalAmount} ر.س`,
        url: window.location.href
      }).catch(() => {});
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
        dir="rtl"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto text-slate-800"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Controls (Hidden in print) */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black">سند قبض مالي ملحق بالحجز</h3>
                <p className="text-[11px] text-slate-400 font-mono">Supplementary Payment Voucher</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة</span>
              </button>
              <button
                onClick={handleShare}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="مشاركة"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Printable Voucher Body */}
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[80vh]">
            
            {/* Top Badge & Number */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-150 pb-5">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>سند معتمد ومسدد بالكامل</span>
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-mono tracking-tight">
                  {voucher.voucherNumber}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  تاريخ الإصدار: {new Date(voucher.orderDate).toLocaleDateString('ar-SA')} - {new Date(voucher.orderDate).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {/* QR Code */}
              <div className="p-2 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center shrink-0 self-start sm:self-auto">
                <QRCodeSVG 
                  value={`https://laylah.com/verify/receipt/${voucher.voucherNumber}`} 
                  size={75}
                  level="M"
                />
                <span className="text-[8px] font-mono text-slate-400 mt-1 uppercase">ZATCA VERIFIED</span>
              </div>
            </div>

            {/* Linked Booking Info Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 block text-[11px]">رقم الحجز الأساسي المربوط:</span>
                <span className="font-mono font-black text-slate-900 text-sm block">#{voucher.bookingNumber}</span>
                <span className="text-slate-600 flex items-center gap-1 mt-1 font-bold">
                  <Building2 className="w-3.5 h-3.5 text-amber-600" />
                  {voucher.venueName}
                </span>
              </div>

              <div className="space-y-1 sm:border-r sm:border-amber-200 sm:pr-4">
                <span className="text-slate-500 block text-[11px]">العميل المُفوتر إليه:</span>
                <span className="font-bold text-slate-900 block">{voucher.customerName}</span>
                <span className="text-slate-600 flex items-center gap-1 mt-1 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  تاريخ المناسبة: {voucher.eventDate}
                </span>
              </div>
            </div>

            {/* Itemized Table */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ShoppingBag className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-black text-slate-900 uppercase">بيان المستلزمات والمنتجات المطلوبة</h4>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="py-2.5 px-3.5">الصنف / البيان</th>
                      <th className="py-2.5 px-2 text-center w-16">الكمية</th>
                      <th className="py-2.5 px-3 text-center w-24">السعر</th>
                      <th className="py-2.5 px-3.5 text-left w-28">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {voucher.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3.5 font-bold text-slate-900">
                          {item.name}
                          {item.category && <span className="text-[10px] text-slate-400 block font-normal">{item.category}</span>}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-center font-mono">{item.unitPrice.toLocaleString()} ر.س</td>
                        <td className="py-2.5 px-3.5 text-left font-mono font-bold text-slate-900">
                          {(item.totalPrice || item.quantity * item.unitPrice).toLocaleString()} ر.س
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>المبلغ الخاضع للضريبة:</span>
                <span className="font-mono font-bold text-slate-700">{voucher.subtotal.toLocaleString()} ر.س</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>ضريبة القيمة المضافة (15%):</span>
                <span className="font-mono font-bold text-slate-700">{voucher.vatAmount.toLocaleString()} ر.س</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm">
                <span className="font-black text-slate-900">إجمالي سند القبض (شامل الضريبة):</span>
                <span className="font-mono font-black text-amber-600 text-lg">
                  {voucher.totalAmount.toLocaleString()} <span className="text-xs font-normal">ر.س</span>
                </span>
              </div>
            </div>

            {/* Legal & System Attachment Notice */}
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200/80 text-[11px] text-blue-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-blue-950">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>إلحاق مالي وقانوني بالعقد الإلكتروني الموحد:</span>
              </div>
              <p className="text-blue-800 leading-relaxed">
                يُعد هذا السند وثيقة رسمية ملحقة بالعقد الإلكتروني الأساسي والفاتورة الضريبية ZATCA، وتثبت استحقاق وتسليم المستلزمات الإضافية لموقع المناسبة.
              </p>
            </div>

            {/* Dispatch Channels Badges */}
            <div className="pt-2 border-t border-slate-150 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
              <span className="font-bold text-slate-700">حالة إرسال الإشعارات متعددة القنوات:</span>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-bold text-[10px] border border-emerald-200">
                  <BellRing className="w-3 h-3" /> In-App
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold text-[10px] border border-blue-200">
                  <Send className="w-3 h-3" /> Email
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md font-bold text-[10px] border border-purple-200">
                  <MessageSquare className="w-3 h-3" /> SMS
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded-md font-bold text-[10px] border border-emerald-300">
                  WhatsApp ✅
                </span>
              </div>
            </div>

          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end print:hidden">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
            >
              إغلاق
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
