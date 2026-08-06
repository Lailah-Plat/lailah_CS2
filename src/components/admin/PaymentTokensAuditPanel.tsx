import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Lock, CreditCard, Landmark, CheckCircle2, 
  AlertCircle, Eye, RefreshCw, FileText, Server, KeyRound, Cpu 
} from 'lucide-react';

interface PaymentTokensAuditPanelProps {
  showNotification: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export default function PaymentTokensAuditPanel({ showNotification }: PaymentTokensAuditPanelProps) {
  const [auditStats, setAuditStats] = useState({
    totalTokens: 142,
    madaTokens: 98,
    visaMasterTokens: 44,
    providerPayoutAccounts: 38,
    verifiedPayoutAccounts: 36,
    pendingKyc: 2,
    encryptionAlgorithm: 'AES-256-CBC (GCM Cloud Key Vault)',
    complianceLevel: 'PCI-DSS Level 1 Tokenization Compliant'
  });

  const [tokensLog, setTokensLog] = useState([
    { id: 'tok_01', ownerType: 'customer', ownerId: 'CUST-1092', brand: 'MADA', last4: '8819', gateway: 'Moyasar', autoRenewal: false, status: 'active', createdAt: '2026-08-01' },
    { id: 'tok_02', ownerType: 'provider', ownerId: 'PROV-2001', brand: 'VISA', last4: '4002', gateway: 'Moyasar', autoRenewal: true, status: 'active', createdAt: '2026-07-28' },
    { id: 'tok_03', ownerType: 'customer', ownerId: 'CUST-1044', brand: 'MASTERCARD', last4: '1109', gateway: 'Moyasar', autoRenewal: false, status: 'active', createdAt: '2026-07-25' },
    { id: 'tok_04', ownerType: 'provider', ownerId: 'PROV-2005', brand: 'MADA', last4: '5543', gateway: 'Moyasar', autoRenewal: true, status: 'active', createdAt: '2026-07-20' },
  ]);

  const [payoutsLog, setPayoutsLog] = useState([
    { id: 'pay_01', providerId: 'PROV-2001', providerName: 'قصر الرياض للاحتفالات', method: 'Connected Account ID', ref: 'acct_moyasar_sa_9981', kyc: 'verified', updatedAt: '2026-08-01' },
    { id: 'pay_02', providerId: 'PROV-2005', providerName: 'مؤسسة الضيافة الملكية', method: 'Encrypted IBAN', ref: 'SA98 **** **** **** 1092', kyc: 'verified', updatedAt: '2026-07-30' },
    { id: 'pay_03', providerId: 'PROV-2010', providerName: 'استوديو اللقطة الذهبية', method: 'Beneficiary Token', ref: 'BEN-TOK-SA-3301', kyc: 'under_review', updatedAt: '2026-08-02' },
  ]);

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Top Notice Banner */}
      <div className="bg-gradient-to-l from-slate-900 via-slate-850 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-3 py-1 rounded-full font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> لوحة تدقيق آمنة للإدارة (Audit & Compliance Only)
              </span>
              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] px-3 py-1 rounded-full font-bold">
                حفظ ذاتي ومباشر للمستخدمين
              </span>
            </div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Lock className="w-6 h-6 text-emerald-400" />
              <span>شاشة تدقيق ومراقبة رمزة بطاقات الدفع وحسابات تسوية المزودين</span>
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed max-w-3xl">
              تُحفظ بطاقات العملاء والمزودين وحسابات التسوية ذاتياً وآلياً بواسطة المستخدمين عبر لوحات تحكمهم الشخصية وبوابات الدفع المعتمدة (Moyasar / HyperPay). لا توجد أدوات إدخال يدوي لبيانات البطاقات في شاشة الإدارة لضمان الامتثال التام لمعايير البنك المركزي السعودي (SAMA) و PCI-DSS.
            </p>
          </div>
        </div>
      </div>

      {/* Security & Audit Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold">التوكنات المحفوظة للعملاء والمزودين</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">{auditStats.totalTokens}</p>
          <div className="text-[10px] text-slate-500 flex justify-between font-bold">
            <span>مدى: {auditStats.madaTokens}</span>
            <span>فيزا/ماستر: {auditStats.visaMasterTokens}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold">حسابات تسوية المزودين (Payouts)</span>
            <Landmark className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">{auditStats.providerPayoutAccounts}</p>
          <div className="text-[10px] text-slate-500 flex justify-between font-bold">
            <span className="text-emerald-700">معتمدة: {auditStats.verifiedPayoutAccounts}</span>
            <span className="text-amber-600">قيد المراجعة: {auditStats.pendingKyc}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold">خوارزمية التشفير السحابي</span>
            <KeyRound className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xs font-black text-slate-800 font-mono mt-1">{auditStats.encryptionAlgorithm}</p>
          <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> مشفر بفريد AES-256 قبل الحفظ
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold">معيار أمان بوابات الدفع</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xs font-black text-slate-800 font-mono mt-1">PCI-DSS Level 1 Tokenization</p>
          <p className="text-[10px] text-slate-500 font-bold">
            0% بيانات بطاقات مكشوفة بالقواعد
          </p>
        </div>
      </div>

      {/* Tokens Audit Log */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h4 className="font-black text-slate-800 text-sm flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-600" />
            <span>سجل توكنات البطاقات المحفوظة ذاتياً (سجل الرقابة والأمان)</span>
          </h4>
          <span className="text-xs text-slate-400 font-mono">عرض آمن مشفر</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <th className="p-3">معرّف التوكن</th>
                <th className="p-3">نوع المالك</th>
                <th className="p-3">معرّف الحساب</th>
                <th className="p-3">شبكة البطاقة</th>
                <th className="p-3">الأرقام الأربعة الأخيرة</th>
                <th className="p-3">بوابة الدفع</th>
                <th className="p-3">التجديد التلقائي (للمزود)</th>
                <th className="p-3">الحالة الأمنية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {tokensLog.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition-all">
                  <td className="p-3 font-bold text-slate-700">{t.id}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.ownerType === 'customer' ? 'bg-indigo-50 text-indigo-700' : 'bg-purple-50 text-purple-700'}`}>
                      {t.ownerType === 'customer' ? 'عميل (Customer)' : 'مزود (Provider)'}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600">{t.ownerId}</td>
                  <td className="p-3 font-bold text-slate-800">{t.brand}</td>
                  <td className="p-3 font-bold text-slate-900">•••• {t.last4}</td>
                  <td className="p-3 text-slate-500">{t.gateway}</td>
                  <td className="p-3">
                    {t.ownerType === 'provider' ? (
                      <span className={`text-[10px] font-bold ${t.autoRenewal ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {t.autoRenewal ? 'موافق مسبقاً 🟢' : 'متوقف'}
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                      نشط ومشفر
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provider Payout Accounts Audit Log */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h4 className="font-black text-slate-800 text-sm flex items-center gap-2">
            <Landmark className="w-4 h-4 text-emerald-600" />
            <span>تدقيق حسابات استلام تسويات المزودين (Payout Accounts KYC Monitor)</span>
          </h4>
          <span className="text-xs text-slate-400 font-mono">مطابقة KYC المعتمدة</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <th className="p-3">رمز التسوية</th>
                <th className="p-3">اسم المنشأة/المزود</th>
                <th className="p-3">طريقة التحويل</th>
                <th className="p-3">مرجع الحساب البنكي / Token</th>
                <th className="p-3">حالة التحقق والـ KYC</th>
                <th className="p-3">تاريخ التحديث</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {payoutsLog.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-all">
                  <td className="p-3 font-bold text-slate-700">{p.id}</td>
                  <td className="p-3 font-sans font-bold text-slate-800">{p.providerName} ({p.providerId})</td>
                  <td className="p-3 text-slate-600">{p.method}</td>
                  <td className="p-3 font-bold text-emerald-700">{p.ref}</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${p.kyc === 'verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {p.kyc === 'verified' ? 'حساب مطابق ومعتمد 🟢' : 'قيد المراجعة والتحقق'}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400">{p.updatedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
