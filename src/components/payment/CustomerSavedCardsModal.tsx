import React, { useState, useEffect } from 'react';
import { 
  CreditCard, ShieldCheck, CheckCircle2, Trash2, Plus, 
  Zap, Clock, ArrowRight, Lock, DollarSign, XCircle, RefreshCw 
} from 'lucide-react';

interface CustomerSavedCardsModalProps {
  customerId: string;
  customerName?: string;
  bookingDetails?: {
    id: number;
    hallName: string;
    totalAmount: number;
    remainingAmount: number;
    installmentSchedule?: Array<{ id: string; dueDate: string; amount: number; status: string }>;
  };
  onClose?: () => void;
  showNotification: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export default function CustomerSavedCardsModal({
  customerId,
  customerName = 'العميل',
  bookingDetails,
  onClose,
  showNotification
}: CustomerSavedCardsModalProps) {
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingTokenId, setProcessingTokenId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New card form
  const [newCard, setNewCard] = useState({
    cardBrand: 'mada',
    cardNumber: '',
    expiryMonth: '08',
    expiryYear: '2028',
    cardholderName: '',
    isDefault: true,
    oneClickEnabled: true
  });

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/finance/payment-tokens?ownerType=customer&ownerId=${customerId}`);
      const data = await res.json();
      if (data.success) {
        setTokens(data.tokens || []);
      }
    } catch (err) {
      console.error('Failed to load customer payment tokens:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, [customerId]);

  const handleSaveCard = async () => {
    if (!newCard.cardNumber || newCard.cardNumber.length < 15) {
      showNotification('error', 'يرجى إدخال رقم بطاقة صحيح مكون من 16 خانة');
      return;
    }
    const lastFour = newCard.cardNumber.slice(-4);
    try {
      const res = await fetch('/api/finance/payment-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerType: 'customer',
          ownerId: customerId,
          gatewayName: 'moyasar',
          cardToken: `TOK-CUST-${Date.now()}-${Math.floor(Math.random() * 9000)}`,
          cardBrand: newCard.cardBrand,
          lastFourDigits: lastFour,
          expiryMonth: newCard.expiryMonth,
          expiryYear: newCard.expiryYear,
          cardholderName: newCard.cardholderName || customerName,
          isDefault: newCard.isDefault,
          oneClickEnabled: newCard.oneClickEnabled
        })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', data.message);
        setShowAddModal(false);
        fetchTokens();
      } else {
        showNotification('error', data.error);
      }
    } catch (err: any) {
      showNotification('error', 'حدث خطأ أثناء حفظ البطاقة: ' + err.message);
    }
  };

  const handleSetDefault = async (tokenId: string) => {
    try {
      const res = await fetch(`/api/finance/payment-tokens/${tokenId}/default`, { method: 'PUT' });
      const data = await res.json();
      if (data.success) {
        showNotification('success', data.message);
        fetchTokens();
      }
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handleDeleteToken = async (tokenId: string) => {
    try {
      const res = await fetch(`/api/finance/payment-tokens/${tokenId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showNotification('info', data.message);
        fetchTokens();
      }
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handleOneClickPay = async (tokenId: string, amount: number, paymentType: string) => {
    setProcessingTokenId(tokenId);
    try {
      const res = await fetch('/api/finance/payment-tokens/one-click-pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId,
          bookingId: bookingDetails?.id,
          amount,
          paymentType,
          description: `سداد ${paymentType} لحجز ${bookingDetails?.hallName || ''}`
        })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', data.message);
      } else {
        showNotification('error', data.error);
      }
    } catch (err: any) {
      showNotification('error', 'حدث خطأ أثناء تنفيذ الدفع: ' + err.message);
    } finally {
      setProcessingTokenId(null);
    }
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Top Banner */}
      <div className="bg-gradient-to-l from-slate-900 via-slate-850 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-3 py-1 rounded-full font-bold flex items-center gap-1">
                <Lock className="w-3 h-3" /> مشفرة ومعتمدة من PCI-DSS 🛡️
              </span>
              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] px-3 py-1 rounded-full font-bold">
                الدفع بنقرة واحدة One-Click
              </span>
            </div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-emerald-400" />
              <span>وسائل الدفع المحفوظة والدفعات المجدولة للعميل</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              احفظ بطاقات مدى والبطاقات الائتمانية بأمان لمواصلة تسديد المتبقي والدفعات المجدولة والاستردادات المباشرة.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            إضافة بطاقة جديدة
          </button>
        </div>
      </div>

      {/* Booking Balance Quick Pay Banner */}
      {bookingDetails && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md">
              حجز حالي: {bookingDetails.hallName}
            </span>
            <div className="mt-2 flex items-center gap-4 font-bold text-slate-800 text-sm">
              <span>الإجمالي: {bookingDetails.totalAmount.toLocaleString('ar-SA')} ريال</span>
              <span className="text-emerald-700">المتبقي للسداد: {bookingDetails.remainingAmount.toLocaleString('ar-SA')} ريال</span>
            </div>
          </div>
          {bookingDetails.remainingAmount > 0 && tokens.length > 0 && (
            <button
              onClick={() => {
                const defaultToken = tokens.find(t => t.isDefault) || tokens[0];
                if (defaultToken) {
                  handleOneClickPay(defaultToken.id, bookingDetails.remainingAmount, 'المبلغ المتبقي بالكامل');
                }
              }}
              disabled={!!processingTokenId}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs transition-all shadow-md flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              {processingTokenId ? 'جاري المعالجة...' : `سداد المتبقي (${bookingDetails.remainingAmount} ريال) بنقرة واحدة`}
            </button>
          )}
        </div>
      )}

      {/* Saved Cards Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>بطاقاتك المحفوظة للعمليات القادمة</span>
        </h4>

        {loading ? (
          <div className="p-8 text-center text-slate-500 font-bold">جاري تحميل البطاقات المحفوظة...</div>
        ) : tokens.length === 0 ? (
          <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
            <CreditCard className="w-12 h-12 text-slate-400 mx-auto" />
            <p className="font-bold text-slate-700 text-sm">لا توجد بطاقات محفوظة حالياً</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              قم بإضافة بطاقة مدى أو بطاقة ائتمانية للاستفادة من خاصية الدفع السريع بنقرة واحدة ودفع الأقساط المجدولة.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs"
            >
              إضافة بطاقة الآن
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tokens.map((token) => (
              <div
                key={token.id}
                className={`p-5 rounded-2xl border transition-all relative ${
                  token.isDefault 
                    ? 'border-emerald-500 bg-gradient-to-br from-emerald-50/50 via-white to-white shadow-sm' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {token.isDefault && (
                  <span className="absolute top-4 left-4 bg-emerald-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                    <CheckCircle2 className="w-3 h-3" /> البطاقة الافتراضية
                  </span>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-8 bg-slate-900 rounded-lg flex items-center justify-center font-black text-white text-xs tracking-wider shadow-xs">
                    {token.cardBrand.toUpperCase()}
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 text-sm font-mono dir-ltr text-right">
                      •••• •••• •••• {token.lastFourDigits}
                    </h5>
                    <p className="text-[11px] text-slate-400">ينتهي في: {token.expiryMonth}/{token.expiryYear}</p>
                  </div>
                </div>

                <div className="text-xs text-slate-600 mb-4 font-bold">
                  اسم حامل البطاقة: {token.cardholderName || customerName}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-2">
                  <div className="flex items-center gap-2">
                    {!token.isDefault && (
                      <button
                        onClick={() => handleSetDefault(token.id)}
                        className="text-[11px] font-bold text-slate-600 hover:text-emerald-700 bg-slate-100 px-2.5 py-1 rounded-lg"
                      >
                        جعلها افتراضية
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteToken(token.id)}
                      className="text-[11px] font-bold text-red-500 hover:text-red-700 p-1"
                      title="حذف البطاقة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {bookingDetails && bookingDetails.remainingAmount > 0 && (
                    <button
                      onClick={() => handleOneClickPay(token.id, bookingDetails.remainingAmount, 'المبلغ المتبقي')}
                      disabled={processingTokenId === token.id}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-xs"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                      {processingTokenId === token.id ? 'جاري السداد...' : 'دفع المتبقي بها'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Card Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-right animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <span>إضافة وتشفير بطاقة جديدة</span>
              </h4>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">نوع البطاقة</label>
                <select
                  value={newCard.cardBrand}
                  onChange={(e) => setNewCard({ ...newCard, cardBrand: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold bg-white outline-none focus:border-emerald-500"
                >
                  <option value="mada">بطاقة مدى (Mada)</option>
                  <option value="visa">فيزا (Visa)</option>
                  <option value="mastercard">ماستركارد (MasterCard)</option>
                  <option value="amex">أمريكان إكسبريس (Amex)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم البطاقة (16 رقم)</label>
                <input
                  type="text"
                  maxLength={16}
                  placeholder="4000 1234 5678 9010"
                  value={newCard.cardNumber}
                  onChange={(e) => setNewCard({ ...newCard, cardNumber: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">شهر الانتهاء</label>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="08"
                    value={newCard.expiryMonth}
                    onChange={(e) => setNewCard({ ...newCard, expiryMonth: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">سنة الانتهاء</label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="2028"
                    value={newCard.expiryYear}
                    onChange={(e) => setNewCard({ ...newCard, expiryYear: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم حامل البطاقة (كما في البطاقة)</label>
                <input
                  type="text"
                  placeholder="MOHAMMED AL-OTAIBI"
                  value={newCard.cardholderName}
                  onChange={(e) => setNewCard({ ...newCard, cardholderName: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={newCard.isDefault}
                    onChange={(e) => setNewCard({ ...newCard, isDefault: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>تعيين كبطاقة افتراضية لجميع المدفوعات القادمة</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveCard}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md"
              >
                تشفير وحفظ البطاقة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
