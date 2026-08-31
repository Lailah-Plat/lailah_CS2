import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Building2,
  Plus,
  Trash,
  UploadCloud
} from 'lucide-react';
import { apiService } from '../../../services/apiService';

interface ProviderProfileDomainProps {
  profileBusinessName: string;
  setProfileBusinessName: (v: string) => void;
  profileBusinessCR: string;
  setProfileBusinessCR: (v: string) => void;
  profileBusinessContact: string;
  setProfileBusinessContact: (v: string) => void;
  profileBusinessDesc: string;
  setProfileBusinessDesc: (v: string) => void;
  profileRepresentativeName: string;
  setProfileRepresentativeName: (v: string) => void;
  profileRepresentativeEmail: string;
  setProfileRepresentativeEmail: (v: string) => void;
  profileRepresentativePhone: string;
  setProfileRepresentativePhone: (v: string) => void;
  profileEntityType: string;
  setProfileEntityType: (v: string) => void;
  profileCity: string;
  setProfileCity: (v: string) => void;
  profileRegion: string;
  setProfileRegion: (v: string) => void;
  profileDistrict: string;
  setProfileDistrict: (v: string) => void;
  profileNationalAddress: string;
  setProfileNationalAddress: (v: string) => void;
  profileMapLink: string;
  setProfileMapLink: (v: string) => void;
  profileLogo: string | null;
  setProfileLogo: (v: string | null) => void;
  showProviderToCustomers: boolean;
  setShowProviderToCustomers: (v: boolean) => void;
  profileUsername: string;
  setProfileUsername: (v: string) => void;
  wizVatStatus: string;
  setWizVatStatus: (v: string) => void;
  wizTaxId: string;
  setWizTaxId: (v: string) => void;
  wizIban: string;
  setWizIban: (v: string) => void;
  wizBankName: string;
  setWizBankName: (v: string) => void;
  wizBankAccountHolder: string;
  setWizBankAccountHolder: (v: string) => void;
  profileBranches: any[];
  setProfileBranches: (branches: any[]) => void;
  profileEmployees: any[];
  setProfileEmployees: (employees: any[]) => void;
  handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export function ProviderProfileDomain({
  profileBusinessName,
  setProfileBusinessName,
  profileBusinessCR,
  setProfileBusinessCR,
  profileBusinessContact,
  setProfileBusinessContact,
  profileBusinessDesc,
  setProfileBusinessDesc,
  profileRepresentativeName,
  setProfileRepresentativeName,
  profileRepresentativeEmail,
  setProfileRepresentativeEmail,
  profileRepresentativePhone,
  setProfileRepresentativePhone,
  profileEntityType,
  setProfileEntityType,
  profileCity,
  setProfileCity,
  profileRegion,
  setProfileRegion,
  profileDistrict,
  setProfileDistrict,
  profileNationalAddress,
  setProfileNationalAddress,
  profileMapLink,
  setProfileMapLink,
  profileLogo,
  setProfileLogo,
  showProviderToCustomers,
  setShowProviderToCustomers,
  profileUsername,
  setProfileUsername,
  wizVatStatus,
  setWizVatStatus,
  wizTaxId,
  setWizTaxId,
  wizIban,
  setWizIban,
  wizBankName,
  setWizBankName,
  wizBankAccountHolder,
  setWizBankAccountHolder,
  profileBranches,
  setProfileBranches,
  profileEmployees,
  setProfileEmployees,
  handleLogoUpload,
  showNotification
}: ProviderProfileDomainProps) {
  const [identityWizStep, setIdentityWizStep] = useState(1);
  const [identityWizData, setIdentityWizData] = useState({
    businessName: profileBusinessName,
    crNumber: profileBusinessCR,
    vatNumber: '301234567800003',
    crExpiry: '2029-06-30',
    contactPhone: profileBusinessContact,
    officialEmail: 'info@laylaevents.com',
    website: 'https://laylaevents.com',
    twitter: '@layla_events',
    instagram: '@layla.events',
    description: profileBusinessDesc,
    slogan: 'ليلتكم الاستثنائية بلمسة ملكية',
    primaryColor: '#4f46e5',
    secondaryColor: '#f59e0b',
    logoSimUrl: '',
  });

  // New Branch Inputs
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchCity, setNewBranchCity] = useState('الرياض');
  const [newBranchAddress, setNewBranchAddress] = useState('');
  const [newBranchManager, setNewBranchManager] = useState('');
  const [newBranchPhone, setNewBranchPhone] = useState('');

  // New Employee Inputs
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpRole, setNewEmpRole] = useState('');
  const [newEmpBranch, setNewEmpBranch] = useState(profileBranches[0]?.name || 'الفرع الرئيسي');
  const [newEmpPerm, setNewEmpPerm] = useState('إدارة تشغيلية كاملة');

  return (
                <div className="space-y-6">
                  {/* Brand Identity Wizard (BOS-Style) */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-right space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="bg-indigo-50 text-indigo-700 text-[9px] font-black px-2.5 py-1 rounded-full uppercase font-mono">Lailah Identity Engine v2.6</span>
                        <span className="text-xs text-slate-400">الخطوة {identityWizStep} من 4</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-slate-800">معالج ترخيص وتحديث الهوية التجارية للمنشأة</h3>
                        <Building2 className="w-5 h-5 text-indigo-600" />
                      </div>
                    </div>

                    {/* Step Indicator */}
                    <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-black pb-2">
                      <div className={`p-2 rounded-xl transition-all ${identityWizStep === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500'}`}>
                        ١. البيانات القانونية
                      </div>
                      <div className={`p-2 rounded-xl transition-all ${identityWizStep === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500'}`}>
                        ٢. قنوات الاتصال
                      </div>
                      <div className={`p-2 rounded-xl transition-all ${identityWizStep === 3 ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500'}`}>
                        ٣. الهوية والسمات
                      </div>
                      <div className={`p-2 rounded-xl transition-all ${identityWizStep === 4 ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500'}`}>
                        ٤. المراجعة والاعتماد
                      </div>
                    </div>

                    {/* Step 1: Legal Info */}
                    {identityWizStep === 1 && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <div className="bg-slate-50 p-3.5 rounded-2xl text-[11px] text-slate-600 leading-relaxed border border-slate-100">
                          يرجى مراجعة وتدقيق البيانات القانونية للمنشأة للتأكد من مطابقتها للسجلات الحكومية السعودية (وزارة التجارة وهيئة الزكاة والضريبة والجمارك).
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 block">اسم المنشأة التجاري الرسمي</label>
                            <input
                              type="text"
                              value={identityWizData.businessName}
                              onChange={(e) => setIdentityWizData({ ...identityWizData, businessName: e.target.value })}
                              className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-right"
                              placeholder="مجموعة قاعات ليالينا للاحتفالات"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 block">رقم السجل التجاري (CR)</label>
                            <input
                              type="text"
                              value={identityWizData.crNumber}
                              onChange={(e) => setIdentityWizData({ ...identityWizData, crNumber: e.target.value })}
                              className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-right font-mono"
                              placeholder="1010XXXXXX"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 block">الرقم الضريبي الموحد (VAT)</label>
                            <input
                              type="text"
                              value={identityWizData.vatNumber}
                              onChange={(e) => setIdentityWizData({ ...identityWizData, vatNumber: e.target.value })}
                              className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-right font-mono"
                              placeholder="301234567800003"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 block">تاريخ انتهاء السجل التجاري</label>
                            <input
                              type="date"
                              value={identityWizData.crExpiry}
                              onChange={(e) => setIdentityWizData({ ...identityWizData, crExpiry: e.target.value })}
                              className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-right font-mono"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 2: Contact Info */}
                    {identityWizStep === 2 && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <div className="bg-slate-50 p-3.5 rounded-2xl text-[11px] text-slate-600 leading-relaxed border border-slate-100">
                          قنوات الاتصال المباشرة المعتمدة تتيح للعملاء ولإدارة منصة ليلة التواصل السريع معكم في أي شؤون لوجستية أو مالية معلقة.
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 block">رقم الجوال المعتمد (Authorized Mobile)</label>
                            <input
                              type="text"
                              value={identityWizData.contactPhone}
                              onChange={(e) => setIdentityWizData({ ...identityWizData, contactPhone: e.target.value })}
                              className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 focus:border-indigo-500 outline-none text-right font-mono"
                              placeholder="055XXXXXXX"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 block">البريد الإلكتروني الرسمي للمراسلات</label>
                            <input
                              type="email"
                              value={identityWizData.officialEmail}
                              onChange={(e) => setIdentityWizData({ ...identityWizData, officialEmail: e.target.value })}
                              className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 focus:border-indigo-500 outline-none text-right font-mono"
                              placeholder="info@yourdomain.com"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 block">الموقع الإلكتروني</label>
                            <input
                              type="text"
                              value={identityWizData.website}
                              onChange={(e) => setIdentityWizData({ ...identityWizData, website: e.target.value })}
                              className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 focus:border-indigo-500 outline-none text-right font-mono"
                              placeholder="https://..."
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 block">حساب المنصة X (تويتر)</label>
                            <input
                              type="text"
                              value={identityWizData.twitter}
                              onChange={(e) => setIdentityWizData({ ...identityWizData, twitter: e.target.value })}
                              className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 focus:border-indigo-500 outline-none text-right font-mono"
                              placeholder="@username"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 block">حساب إنستغرام</label>
                            <input
                              type="text"
                              value={identityWizData.instagram}
                              onChange={(e) => setIdentityWizData({ ...identityWizData, instagram: e.target.value })}
                              className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 focus:border-indigo-500 outline-none text-right font-mono"
                              placeholder="@username"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 3: Brand Stylings */}
                    {identityWizStep === 3 && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <div className="bg-slate-50 p-3.5 rounded-2xl text-[11px] text-slate-600 leading-relaxed border border-slate-100">
                          حدد السلوجان والوصف التجاري العام والألوان المفضلة لشاشات الحجز الخاصة بك، لضمان مظهر متناسق واحترافي أمام عملائك.
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 block">الشعار اللفظي المعتمد (Slogan)</label>
                            <input
                              type="text"
                              value={identityWizData.slogan}
                              onChange={(e) => setIdentityWizData({ ...identityWizData, slogan: e.target.value })}
                              className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 focus:border-indigo-500 outline-none text-right"
                              placeholder="ليلتكم الاستثنائية بلمسة ملكية"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 block">ألوان الهوية التجارية المعتمدة</label>
                            <div className="flex gap-4">
                              <div className="flex items-center gap-1.5 flex-1 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                                <input
                                  type="color"
                                  value={identityWizData.primaryColor}
                                  onChange={(e) => setIdentityWizData({ ...identityWizData, primaryColor: e.target.value })}
                                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                                />
                                <span className="text-[10px] font-bold text-slate-600">اللون الأساسي</span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-1 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                                <input
                                  type="color"
                                  value={identityWizData.secondaryColor}
                                  onChange={(e) => setIdentityWizData({ ...identityWizData, secondaryColor: e.target.value })}
                                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                                />
                                <span className="text-[10px] font-bold text-slate-600">اللون الثانوي</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 block">الوصف التجاري التعريفي للخدمات والمزايا</label>
                          <textarea
                            value={identityWizData.description}
                            onChange={(e) => setIdentityWizData({ ...identityWizData, description: e.target.value })}
                            rows={3}
                            className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:border-indigo-500 outline-none text-right leading-relaxed"
                            placeholder="نقدم أرقى الخدمات للعروسين..."
                          />
                        </div>

                        {/* Real Interactive Logo Upload with Instant Preview */}
                        <div 
                          className="provider-logo-upload-container aspect-square w-full max-w-[200px] mx-auto flex flex-col items-center justify-center p-2 border-2 border-dashed border-indigo-400 dark:border-indigo-400 hover:border-indigo-600 dark:hover:border-indigo-300 rounded-2xl bg-indigo-50/30 dark:bg-slate-800/90 hover:bg-indigo-50/60 transition-all cursor-pointer relative group overflow-hidden shadow-sm dark:shadow-[0_0_15px_rgba(129,140,248,0.25)]"
                          onClick={() => document.getElementById('settings-logo-file-input')?.click()}
                        >
                          <input
                            type="file"
                            id="settings-logo-file-input"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                          {profileLogo ? (
                            <div className="relative w-full h-full p-1.5 flex items-center justify-center animate-in fade-in duration-200">
                              {/* Floating Remove Button in top corner */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProfileLogo(null);
                                  const input = document.getElementById('settings-logo-file-input') as HTMLInputElement;
                                  if (input) input.value = '';
                                  showNotification('info', 'تمت إزالة شعار المنشأة.');
                                }}
                                className="absolute top-2 left-2 z-20 text-[10px] font-black text-white bg-rose-600 hover:bg-rose-700 px-2 py-0.5 rounded-lg border border-rose-400/80 shadow-md transition-all flex items-center gap-1 cursor-pointer hover:scale-105"
                                title="إزالة الشعار"
                              >
                                <Trash className="w-3.5 h-3.5" />
                                <span>إزالة</span>
                              </button>

                              {/* Centered preview image */}
                              <div className="relative w-full h-full rounded-xl overflow-hidden flex items-center justify-center border-2 border-indigo-500/80 shadow-sm group/img">
                                <img 
                                  src={profileLogo} 
                                  alt="معاينة شعار المنشأة" 
                                  className="w-full h-full object-cover transition-transform group-hover/img:scale-105" 
                                  referrerPolicy="no-referrer" 
                                />
                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                  <span className="text-[10px] font-black text-white bg-indigo-600/90 backdrop-blur-xs px-2.5 py-1 rounded-lg shadow">تغيير الصورة</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1.5 p-2 text-center flex flex-col items-center justify-center">
                              <UploadCloud className="w-8 h-8 text-indigo-500 dark:text-indigo-400 mx-auto group-hover:scale-110 transition-transform" />
                              <span className="block text-[10px] font-black text-indigo-950 dark:text-indigo-200">رفع شعار المنشأة الرسمي (PNG, JPEG, WebP)</span>
                              <span className="block text-[8px] text-slate-500 dark:text-slate-300 font-sans">الحد الأقصى 500KB - أبعاد حتى 960x960 بكسل</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Step 4: Review and Submit */}
                    {identityWizStep === 4 && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-2xl text-[11px] leading-relaxed border border-emerald-100">
                          ✓ جميع حقول البيانات القانونية والتشغيلية الموحدة مكتملة بنسبة ١٠٠٪ وبانتظام تام مع نظام تخطيط موارد المنشأة (ERP).
                        </div>

                        {/* ID Card Display */}
                        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-6 relative overflow-hidden shadow-md border-t-4 border-amber-400">
                          <div className="absolute top-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
                          <div className="flex justify-between items-start relative z-10">
                            <div className="text-left font-mono">
                              <span className="text-[8px] tracking-widest text-slate-400 uppercase block font-sans">PROVIDER ENROLLMENT ID</span>
                              <span className="text-xs font-black text-amber-300">CR-{identityWizData.crNumber}</span>
                            </div>
                            <div className="text-right space-y-1">
                              <span className="bg-amber-400 text-slate-900 text-[8px] font-black px-2 py-0.5 rounded-full">شريك معتمد</span>
                              <h4 className="text-base font-black">{identityWizData.businessName}</h4>
                              <p className="text-[10px] text-indigo-200 font-bold">{identityWizData.slogan}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/10 text-right text-[10px] relative z-10">
                            <div>
                              <span className="text-slate-400 block">رقم الجوال المعتمد</span>
                              <span className="font-mono text-xs font-extrabold text-slate-200">{identityWizData.contactPhone}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">الرقم الضريبي الموحد</span>
                              <span className="font-mono text-xs font-extrabold text-slate-200">{identityWizData.vatNumber}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-slate-400 block">الوصف البانورامي للمنشأة</span>
                              <p className="text-slate-300 text-[10px] leading-relaxed mt-0.5">{identityWizData.description}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                      <div>
                        {identityWizStep > 1 && (
                          <button
                            onClick={() => setIdentityWizStep(identityWizStep - 1)}
                            className="px-4 py-2 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-black cursor-pointer"
                          >
                            السابق
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {identityWizStep < 4 ? (
                          <button
                            onClick={() => {
                              if (identityWizStep === 1 && !identityWizData.businessName) {
                                showNotification('warning', 'يرجى إدخال اسم المنشأة التجاري أولاً.');
                                return;
                              }
                              setIdentityWizStep(identityWizStep + 1);
                            }}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black cursor-pointer"
                          >
                            التالي
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setProfileBusinessName(identityWizData.businessName);
                              setProfileBusinessCR(identityWizData.crNumber);
                              setProfileBusinessDesc(identityWizData.description);
                              setProfileBusinessContact(identityWizData.contactPhone);
                              
                              // Sync to cloud database
                              apiService.syncProfile({
                                providerName: identityWizData.businessName || profileBusinessName,
                                showProviderToCustomers: showProviderToCustomers,
                                username: showProviderToCustomers ? (identityWizData.businessName || profileBusinessName) : profileUsername,
                                settings: {
                                  businessName: identityWizData.businessName,
                                  crNumber: identityWizData.crNumber,
                                  description: identityWizData.description,
                                  contactPhone: identityWizData.contactPhone,
                                  vatNumber: identityWizData.vatNumber
                                }
                              }).catch(err => console.error('Cloud identity sync error:', err));

                              window.dispatchEvent(new Event('storage'));
                              window.dispatchEvent(new Event('settingsUpdated'));
                              window.dispatchEvent(new Event('providerDataSynced'));

                              setIdentityWizStep(1); // Reset
                              showNotification('success', 'تهانينا! تم تحديث واعتماد الهوية التجارية للمنشأة بالكامل في نظام تشغيل الأعمال ERP بنجاح.');
                            }}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-md"
                          >
                            اعتماد وتحديث الهوية الموحدة
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Branches Management */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                      <span className="text-[10px] font-black text-slate-400 font-mono">BRANCHES MANAGEMENT</span>
                      <h3 className="text-sm font-black text-slate-800">إدارة الفروع المستقلة ({profileBranches.length})</h3>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                          <tr>
                            <th className="p-3 font-black">معرف الفرع</th>
                            <th className="p-3 font-black">اسم الفرع</th>
                            <th className="p-3 font-black">المدينة</th>
                            <th className="p-3 font-black">رقم التواصل</th>
                            <th className="p-3 font-black">العنوان</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 font-sans">
                          {profileBranches.map((br) => (
                            <tr key={br.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-mono text-slate-500 font-bold">{br.id}</td>
                              <td className="p-3 font-extrabold text-slate-800">{br.name}</td>
                              <td className="p-3 text-slate-600">{br.city}</td>
                              <td className="p-3 font-mono text-slate-600">{br.phone}</td>
                              <td className="p-3 text-slate-500">{br.address}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Add Branch form */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 mt-2">
                      <h4 className="text-xs font-black text-indigo-700">إضافة فرع مستقل جديد</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <input
                          type="text"
                          placeholder="اسم الفرع (مثل: فرع الرياض الغربي)"
                          value={newBranchName}
                          onChange={(e) => setNewBranchName(e.target.value)}
                          className="p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
                        />
                        <select
                          value={newBranchCity}
                          onChange={(e) => setNewBranchCity(e.target.value)}
                          className="p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
                        >
                          <option value="الرياض">الرياض</option>
                          <option value="جدة">جدة</option>
                          <option value="الدمام">الدمام</option>
                          <option value="المدينة المنورة">المدينة المنورة</option>
                        </select>
                        <input
                          type="text"
                          placeholder="رقم هاتف الفرع"
                          value={newBranchPhone}
                          onChange={(e) => setNewBranchPhone(e.target.value)}
                          className="p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono"
                        />
                        <input
                          type="text"
                          placeholder="العنوان التفصيلي للفرع"
                          value={newBranchAddress}
                          onChange={(e) => setNewBranchAddress(e.target.value)}
                          className="p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (!newBranchName || !newBranchPhone) {
                            showNotification('warning', 'يرجى كتابة اسم الفرع ورقم التواصل أولاً.');
                            return;
                          }
                          const newIdNum = profileBranches.length + 1;
                          const newBranch = {
                            id: `BR-26-${String(newIdNum).padStart(8, '0')}`,
                            name: newBranchName,
                            city: newBranchCity,
                            phone: newBranchPhone,
                            address: newBranchAddress || 'العنوان المسجل'
                          };
                          setProfileBranches([...profileBranches, newBranch]);
                          setNewBranchName('');
                          setNewBranchPhone('');
                          setNewBranchAddress('');
                          showNotification('success', `تم إضافة الفرع الجديد بنجاح بالمعرّف ${newBranch.id}`);
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        حفظ وإنشاء الفرع بنظام ERP
                      </button>
                    </div>
                  </div>

                  {/* Employees Management */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                      <span className="text-[10px] font-black text-slate-400 font-mono">STAFF ACCESS CONTROL</span>
                      <h3 className="text-sm font-black text-slate-800">الكوادر التشغيلية والصلاحيات والمناوبة</h3>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                          <tr>
                            <th className="p-3 font-black">معرّف الكادر</th>
                            <th className="p-3 font-black">الاسم</th>
                            <th className="p-3 font-black">الدور التشغيلي</th>
                            <th className="p-3 font-black">الفرع التابع له</th>
                            <th className="p-3 font-black">مستوى الصلاحية</th>
                            <th className="p-3 font-black">حالة المناوبة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {profileEmployees.map((emp) => (
                            <tr key={emp.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-mono text-slate-500 font-bold">{emp.id}</td>
                              <td className="p-3 font-extrabold text-slate-800">{emp.name}</td>
                              <td className="p-3 text-slate-700">{emp.role}</td>
                              <td className="p-3 text-indigo-600 font-bold">{emp.branch}</td>
                              <td className="p-3 text-slate-500">
                                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-black">
                                  {emp.permissions}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-black">
                                  {emp.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Add Employee Form */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 mt-2">
                      <h4 className="text-xs font-black text-indigo-700">إضافة موظف/مشرف لوجستي جديد في نظام ERP</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <input
                          type="text"
                          placeholder="اسم الموظف الثلاثي"
                          value={newEmpName}
                          onChange={(e) => setNewEmpName(e.target.value)}
                          className="p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
                        />
                        <input
                          type="text"
                          placeholder="الدور (مثل: مشرف تجهيز وإشراف)"
                          value={newEmpRole}
                          onChange={(e) => setNewEmpRole(e.target.value)}
                          className="p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
                        />
                        <select
                          value={newEmpBranch}
                          onChange={(e) => setNewEmpBranch(e.target.value)}
                          className="p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
                        >
                          {profileBranches.map(br => (
                            <option key={br.id} value={br.name}>{br.name}</option>
                          ))}
                        </select>
                        <select
                          value={newEmpPerm}
                          onChange={(e) => setNewEmpPerm(e.target.value)}
                          className="p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
                        >
                          <option value="إدارة تشغيلية كاملة">إدارة تشغيلية كاملة</option>
                          <option value="متابعة تجهيز العمليات">متابعة وتجهيز العمليات</option>
                          <option value="استعراض الحجوزات فقط">استعراض الحجوزات فقط</option>
                          <option value="محدودة للفرع">محدودة للفرع</option>
                        </select>
                      </div>
                      <button
                        onClick={() => {
                          if (!newEmpName || !newEmpRole) {
                            showNotification('warning', 'يرجى تعبئة اسم الموظف ودوره اللوجستي.');
                            return;
                          }
                          const newEmpIdNum = profileEmployees.length + 1;
                          const newEmp = {
                            id: `EMP-26-${String(newEmpIdNum).padStart(8, '0')}`,
                            name: newEmpName,
                            role: newEmpRole,
                            branch: newEmpBranch,
                            permissions: newEmpPerm,
                            status: 'نشط'
                          };
                          setProfileEmployees([...profileEmployees, newEmp]);
                          setNewEmpName('');
                          setNewEmpRole('');
                          showNotification('success', `تم بنجاح ربط الموظف ${newEmp.name} بالفرع وتوليد المعرف الفريد ${newEmp.id}`);
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        ربط الموظف بالفرع وتعيين الصلاحيات
                      </button>
                    </div>
                  </div>
                </div>
  );
}
