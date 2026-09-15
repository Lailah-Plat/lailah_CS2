import React, { useState } from 'react';
import { 
  X, 
  CreditCard, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  AlertCircle,
  FileText
} from 'lucide-react';

interface DirectPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  isServiceRequest?: boolean;
  onPaymentSuccess: (updatedItem: any) => void;
}

export const DirectPaymentModal: React.FC<DirectPaymentModalProps> = ({
  isOpen,
  onClose,
  booking,
  isServiceRequest = false,
  onPaymentSuccess
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'mada' | 'creditMax' | 'apple' | 'stc' | 'tamara' | 'tabby' | 'bank_transfer'>('mada');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !booking) return null;

  const totalAmount = Number(booking.totalAmount || booking.amount || booking.price || 0);
  const baseAmount = Math.round((totalAmount / 1.15) * 100) / 100;
  const vatAmount = Math.round((totalAmount - baseAmount) * 100) / 100;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);

    try {
      const endpoint = isServiceRequest 
        ? `/api/bookings/support-requests/${booking.id}/pay`
        : `/api/bookings/${booking.id}/pay`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod,
          paidAmount: totalAmount
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'فشلت عملية السداد، يرجى المحاولة مرة أخرى.');
      }

      setSuccess(true);
      const updated = data.booking || data.request || data.data || {
        ...booking,
        status: 'confirmed',
        paymentStatus: 'paid_full'
      };

      // Trigger global event for reactive UI updates
      window.dispatchEvent(new Event('booking_updated'));

      setTimeout(() => {
        onPaymentSuccess(updated);
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'حدث خطأ غير متوقع أثناء معالجة الدفع.');
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-white text-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg">بوابة السداد وتأكيد الحجز الفوري</h3>
              <p className="text-xs text-slate-300">
                {isServiceRequest ? `طلب خدمة: ${booking.serviceName}` : `حجز: ${booking.hallName || booking.title || `رقم #${booking.id}`}`}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={processing}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!success ? (
          <form onSubmit={handlePay} className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Acceptance Banner */}
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-2xl p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-emerald-900">تمت موافقة المزود رسمياً على طلبك!</p>
                <p className="text-emerald-800">
                  تم اعتماد طلبك من قبل المزود بنجاح. يرجى إتمام السداد لتأكيد الحجز وتثبيت الموعد وإصدار الفاتورة الضريبية ZATCA.
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 flex items-start gap-3 text-xs">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">تعذر إتمام الدفع</p>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {/* Financial Summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <h4 className="font-bold text-slate-800 text-sm flex items-center justify-between">
                <span>تفاصيل الفاتورة والمبلغ المستحق</span>
                <span className="text-[10px] text-slate-500 font-normal">شامل ضريبة القيمة المضافة 15%</span>
              </h4>
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>المبلغ الخاضع للضريبة (الوعاء الأساسي):</span>
                  <span className="font-mono">{baseAmount.toLocaleString()} ر.س</span>
                </div>
                <div className="flex justify-between">
                  <span>ضريبة القيمة المضافة (15% VAT):</span>
                  <span className="font-mono">{vatAmount.toLocaleString()} ر.س</span>
                </div>
                <div className="flex justify-between font-extrabold text-blue-950 text-base pt-2 border-t border-slate-200">
                  <span>الإجمالي النهائي المستحق:</span>
                  <span className="text-orange-600">{totalAmount.toLocaleString()} ر.س</span>
                </div>
              </div>
            </div>

            {/* Gateway Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">اختر وسيلة الدفع الآمنة:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { key: 'mada', name: 'مدى Mada' },
                  { key: 'creditMax', name: 'البطاقة الائتمانية' },
                  { key: 'apple', name: 'Apple Pay' },
                  { key: 'stc', name: 'STC Pay' },
                  { key: 'tamara', name: 'تمارا (قسطين)' },
                  { key: 'tabby', name: 'تابي (Tabby)' },
                  { key: 'bank_transfer', name: 'تحويل بنكي' }
                ].map((gw) => (
                  <label 
                    key={gw.key} 
                    className={`border rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all ${
                      paymentMethod === gw.key 
                        ? 'border-amber-500 bg-amber-50/80 shadow-sm text-amber-950' 
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="payment_direct" 
                      value={gw.key} 
                      className="hidden" 
                      checked={paymentMethod === gw.key} 
                      onChange={() => setPaymentMethod(gw.key as any)} 
                    />
                    <CreditCard className={`w-5 h-5 mb-1.5 ${paymentMethod === gw.key ? 'text-amber-600' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold text-center">{gw.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Security Guarantee */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-100 p-3 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                مدفوعاتك محمية بضمان منصة ليلة المالي ومشفرة وفق أعلى معايير أمان البنوك السعودية (PCI-DSS).
              </span>
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button 
                type="button" 
                onClick={onClose}
                disabled={processing}
                className="px-5 py-3 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-xs transition-colors"
              >
                إلغاء
              </button>
              <button 
                type="submit"
                disabled={processing}
                className="px-6 py-3 bg-blue-950 hover:bg-blue-900 text-white rounded-xl font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>جاري تأكيد السداد وإصدار الفاتورة...</span>
                  </>
                ) : (
                  <>
                    <span>سداد {totalAmount.toLocaleString()} ر.س الآن 💳</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-8 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-extrabold text-blue-950">تم السداد وتأكيد الحجز بنجاح!</h4>
            <p className="text-xs text-slate-600 max-w-md leading-relaxed">
              تم تثبيت الموعد رسمياً وإصدار الفاتورة الضريبية المعتمدة ZATCA. يمكنك الآن استعراض الفاتورة وتحميلها من قائمة حجوزاتك.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
              <FileText className="w-4 h-4" />
              <span>تم تحديث حالة الحجز إلى: مؤكد (مدفوع بالكامل)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default DirectPaymentModal;
