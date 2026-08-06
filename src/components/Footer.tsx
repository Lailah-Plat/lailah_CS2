import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Headset, MapPin, Mail } from 'lucide-react';

export default function Footer() {
  const [platformData, setPlatformData] = useState(() => {
    try {
      const stored = localStorage.getItem('PLATFORM_DATA');
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    return {
      phones: '920000000, +966 50 000 0000',
      emails: 'support@layla.com.sa, info@layla.com.sa',
      address: 'الرياض، المملكة العربية السعودية',
      x: '',
      facebook: '',
      instagram: '',
      snapchat: '',
      tiktok: '',
      youtube: '',
      linkedin: '',
      jaco: '',
      sbcLink: '',
      sbcNumber: '',
      maroofLink: '',
      taxNumber: '',
      crNumber: ''
    };
  });

  const [paymentSettings, setPaymentSettings] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('PAYMENT_SETTINGS');
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    return { mada: true, creditMax: true, apple: true };
  });

  React.useEffect(() => {
    const handleStorage = () => {
      try {
        const pd = localStorage.getItem('PLATFORM_DATA');
        if (pd) setPlatformData(JSON.parse(pd));
        
        const ps = localStorage.getItem('PAYMENT_SETTINGS');
        if (ps) setPaymentSettings(JSON.parse(ps));
      } catch (e) {}
    };
    window.addEventListener('storage', handleStorage);
    // Also use a custom event for same-tab updates
    window.addEventListener('settingsUpdated', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('settingsUpdated', handleStorage);
    };
  }, []);

  // Basic Social Media SVG icons
  const SocialIcons: Record<string, React.ReactNode> = {
    x: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
    facebook: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>,
    instagram: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>,
    snapchat: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11.996 1.835c1.4.032 2.802.264 4.09 1.137 1.547.96 2.453 2.502 2.766 4.298.114.654.162 1.32.222 1.984.07 1.05.148 2.13.415 3.14.3.132.616.208.948.243 1.026.069 2.053-.131 3.011-.532l.37.5c-.328 1.488-.934 2.898-1.748 4.167-.406.66-.99 1.144-1.636 1.56-.25.17-.48.334-.69.51v.17c1.3.18 2.65.26 3.96.48-.12.43-.27.85-.43 1.25-.43 1.21-1.28 2.22-2.38 2.89-.5.29-1.03.54-1.57.73l-.04-1.5c-1.39.29-2.82.37-4.24.46h-2.1c-1.42-.09-2.85-.17-4.24-.46l-.04 1.5c-.54-.19-1.07-.44-1.57-.73-1.1-.67-1.95-1.68-2.38-2.89-.16-.4-.31-.82-.43-1.25 1.31-.22 2.66-.3 3.96-.48v-.17c-.21-.176-.44-.34-.69-.51-.646-.416-1.23-.9-1.636-1.56C1.136 15.485.53 14.075.202 12.587l.37-.5c.958.401 1.985.601 3.011.532.332-.035.648-.111.948-.243.267-1.01.345-2.09.415-3.14.06-.664.108-1.33.222-1.984.313-1.796 1.219-3.338 2.766-4.298 1.288-.873 2.69-1.105 4.09-1.137l-.028.018z"/></svg>,
    tiktok: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v7.2c0 1.2-.23 2.4-.68 3.51-.83 2-2.37 3.56-4.38 4.23-1.42.47-2.98.54-4.45.28-2.28-.4-4.28-1.84-5.35-3.86-1-1.88-1.25-4.14-.56-6.19.64-1.87 2.05-3.4 3.86-4.24 1.4-.64 2.99-.86 4.51-.73v4.06c-.85-.02-1.71.1-2.49.44-1.1.47-1.93 1.4-2.26 2.53-.33 1.13-.19 2.37.37 3.4.67 1.2 1.91 1.98 3.26 2.09 1.42.11 2.87-.27 3.99-1.11.99-.74 1.61-1.88 1.71-3.13.11-1.39.04-2.79.04-4.18V.02h-1.61z"/></svg>,
    youtube: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 7.1c.1-1.6 1.4-2.9 3-3.1C8.6 3.7 12 3.7 15.4 4c1.6.2 2.9 1.5 3 3.1.2 1.6.2 3.3.2 4.9s0 3.3-.2 4.9c-.1 1.6-1.4 2.9-3 3.1-3.4.3-6.8.3-10.2 0-1.6-.2-2.9-1.5-3-3.1-.2-1.6-.2-3.3-.2-4.9s0-3.3.2-4.9z"/><path d="m10 15 5-3-5-3z"/></svg>,
    linkedin: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>,
    jaco: <span className="font-bold text-[10px]">JACO</span> // Text fallback for Jaco
  };

  const getPaymentUI = () => {
    const list = [];
    if (paymentSettings.creditMax) {
      list.push(<div key="visa" className="w-12 h-8 bg-white rounded flex items-center justify-center text-[#0a192f] font-bold text-[10px]">VISA</div>);
      list.push(<div key="master" className="w-12 h-8 bg-white rounded flex items-center justify-center text-[#e50000] font-bold text-[10px]">Master</div>);
    }
    if (paymentSettings.mada) {
      list.push(<div key="mada" className="w-12 h-8 bg-white rounded flex items-center justify-center text-[#006e86] font-bold text-[10px]">Mada</div>);
    }
    if (paymentSettings.apple) {
      list.push(<div key="apple" className="w-12 h-8 bg-white rounded flex items-center justify-center text-[#000000] font-bold text-[10px]">Apple Pay</div>);
    }
    if (paymentSettings.google_pay) {
      list.push(<div key="google" className="w-12 h-8 bg-white rounded flex items-center justify-center text-[#4285F4] font-bold text-[10px]">G Pay</div>);
    }
    if (paymentSettings.stc) {
      list.push(<div key="stc" className="w-12 h-8 bg-white rounded flex items-center justify-center text-[#4f008c] font-bold text-[10px]">STC Pay</div>);
    }
    if (paymentSettings.tabby) {
      list.push(<div key="tabby" className="w-12 h-8 bg-white rounded border border-emerald-500/20 flex items-center justify-center text-[#3eedbf] font-bold text-[10px]">Tabby</div>);
    }
    if (paymentSettings.tamara) {
      list.push(<div key="tamara" className="w-12 h-8 bg-black rounded flex items-center justify-center text-[#f8a970] font-bold text-[10px]">Tamara</div>);
    }
    if (paymentSettings.bank_transfer) {
      list.push(<div key="bank" className="h-8 px-2 bg-white rounded flex items-center justify-center text-[#0a192f] font-bold text-[10px]">Bank Transfer</div>);
    }
    return list;
  };

  return (
    <footer className="bg-blue-950 text-white pt-16 pb-8 border-t-[10px] border-amber-500">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-blue-950 font-bold text-xl shadow-lg">ل</div>
              <span className="text-2xl font-bold tracking-wide">منصة ليلة</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              المنصة الأولى والأكثر موثوقية في المملكة لحجز أرقى قاعات الأفراح والاستراحات والشاليهات بكل سهولة وأمان.
            </p>
            {(platformData.sbcLink || platformData.maroofLink || platformData.taxNumber || platformData.crNumber) && (
              <div className="flex flex-wrap items-center gap-4 mt-6">
                {platformData.sbcLink && (
                  <div className="flex items-center gap-2 bg-white/5 py-1.5 px-3 rounded-xl border border-white/10 w-fit">
                    <a href={platformData.sbcLink} target="_blank" rel="noreferrer" className="hover:opacity-80 transition-opacity" title="المركز السعودي للأعمال">
                      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-1 overflow-hidden" title="المركز السعودي للأعمال">
                        <img 
                          src="https://business.sa/images/logo.svg" 
                          alt="المركز السعودي للأعمال" 
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerHTML = '<span class="text-xs font-bold text-emerald-700 leading-tight">SBC</span>';
                          }}
                        />
                      </div>
                    </a>
                    {platformData.sbcNumber && (
                      <div className="flex flex-col gap-0.5 ml-1">
                        <span className="text-[10px] text-slate-400 leading-none">تـــوثـيــــق</span>
                        <span className="text-white font-mono font-bold text-xs">{platformData.sbcNumber}</span>
                      </div>
                    )}
                  </div>
                )}
                {platformData.maroofLink && (
                  <a href={platformData.maroofLink} target="_blank" rel="noreferrer" className="hover:opacity-80 transition-opacity bg-white/5 p-1.5 rounded-xl border border-white/10 w-fit" title="منصة معروف">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden p-1">
                      <img 
                        src="https://maroof.sa/assets/images/logo.png" 
                        alt="معروف"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = '<span class="text-xs font-bold text-amber-500 leading-tight block text-center">معروف</span>';
                        }}
                      />
                    </div>
                  </a>
                )}
                {(platformData.taxNumber || platformData.crNumber) && (
                  <div className="flex items-center gap-3 bg-white/5 py-2 px-4 rounded-xl border border-white/10 w-fit">
                     <div className="w-10 h-10 bg-[#008f75] rounded-lg flex items-center justify-center text-white font-bold text-[10px] tracking-tighter leading-none text-center shadow-inner" title="ZATCA">هيـئـــة<br/>الـــزكاة</div>
                     <div className="flex flex-col gap-1 text-[11px] text-slate-300">
                       {platformData.taxNumber && (
                          <div>الضريبي: <span className="text-white font-mono">{platformData.taxNumber}</span></div>
                       )}
                       {platformData.crNumber && (
                          <div>س ت: <span className="text-white font-mono">{platformData.crNumber}</span></div>
                       )}
                     </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div>
            <h4 className="text-lg font-bold text-white mb-6 relative inline-block">
              روابط سريعة
              <span className="absolute -bottom-2 right-0 w-1/2 h-1 bg-amber-500 rounded-full"></span>
            </h4>
            <ul className="space-y-3">
              <li><Link to="/" className="text-slate-300 hover:text-amber-500 transition-colors text-sm">الرئيسية</Link></li>
              <li><Link to="/about" className="text-slate-300 hover:text-amber-500 transition-colors text-sm">من نحن</Link></li>
              <li><Link to="/privacy" className="text-slate-300 hover:text-amber-500 transition-colors text-sm">سياسة الخصوصية</Link></li>
              <li><Link to="/terms" className="text-slate-300 hover:text-amber-500 transition-colors text-sm">الشروط والأحكام</Link></li>
              <li><Link to="/faq" className="text-slate-300 hover:text-amber-500 transition-colors text-sm">الأسئلة الشائعة</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold text-white mb-6 relative inline-block">
              تواصل معنا
              <span className="absolute -bottom-2 right-0 w-1/2 h-1 bg-amber-500 rounded-full"></span>
            </h4>
            <ul className="space-y-4 text-slate-300 text-sm">
              {platformData.phones && platformData.phones.split(/[,،\n]/).filter(Boolean).slice(0, 2).map((phone: string, i: number) => (
                <li key={i} className="flex items-center gap-3">
                  <Headset className="w-5 h-5 text-amber-500" />
                  <span dir="ltr">{phone.trim()}</span>
                </li>
              ))}
              {platformData.emails && platformData.emails.split(/[,،\n]/).filter(Boolean).slice(0, 1).map((email: string, i: number) => (
                <li key={i} className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-amber-500" />
                  <span dir="ltr">{email.trim()}</span>
                </li>
              ))}
              {platformData.address && (
                <li className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-amber-500 shrink-0" />
                  <span>{platformData.address.split('\n')[0]}</span>
                </li>
              )}
              {platformData.workingHours && (
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 flex items-center justify-center border-2 border-amber-500 rounded-full text-amber-500 font-bold text-[10px] shrink-0">W</div>
                  <span>{platformData.workingHours.split('\n')[0]}</span>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold text-white mb-6 relative inline-block">
              طرق الدفع الآمنة
              <span className="absolute -bottom-2 right-0 w-1/2 h-1 bg-amber-500 rounded-full"></span>
            </h4>
            <div className="flex flex-wrap gap-2 mb-8">
              {getPaymentUI().length > 0 ? getPaymentUI() : (
                <span className="text-xs text-slate-400">لا توجد طرق دفع متاحة</span>
              )}
            </div>

            <h4 className="text-lg font-bold text-white mb-6 relative inline-block">
              تابعنا
              <span className="absolute -bottom-2 right-0 w-1/2 h-1 bg-amber-500 rounded-full"></span>
            </h4>
            <div className="flex flex-wrap gap-4">
              {['x', 'facebook', 'instagram', 'snapchat', 'tiktok', 'youtube', 'linkedin', 'jaco'].map(social => {
                const url = platformData[social as keyof typeof platformData];
                if (!url) return null;
                return (
                  <a key={social} href={url} target="_blank" rel="noreferrer" className="hover:text-amber-500 transition-colors w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center hover:bg-white hover:-translate-y-1" title={social}>
                    {SocialIcons[social]}
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-blue-900 pt-8 flex flex-col md:flex-row items-center justify-center gap-4 text-sm text-slate-400">
          <p>جميع الحقوق محفوظة © {new Date().getFullYear()} لمنصة ليلة</p>
        </div>
      </div>
    </footer>
  );
}
