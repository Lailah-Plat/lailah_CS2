import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from 'lucide-react';
import { PhoneInput } from '../components/common/ValidationInputs';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSuccess, setIsSuccess] = useState(false);

  const [platformData, setPlatformData] = useState(() => {
    try {
      const stored = localStorage.getItem('PLATFORM_DATA');
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    return {
      phones: '920000000, +966 50 000 0000',
      emails: 'support@layla.com.sa, info@layla.com.sa',
      address: 'الرياض، المملكة العربية السعودية\nحي العليا، برج المملكة',
      workingHours: 'الأحد - الخميس: 9:00 صباحاً - 5:00 مساءً\nالجمعة - السبت: مغلق'
    };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save to support tickets
    try {
      const stored = localStorage.getItem('supportTickets');
      const tickets = stored ? JSON.parse(stored) : [];
      const newTicket = {
        id: 'TKT-' + Math.floor(Math.random() * 10000),
        title: formData.subject || 'استفسار عام',
        description: `الرسالة:\n${formData.message}\n\nبيانات التواصل:\nالاسم: ${formData.name}\nالبريد: ${formData.email}\nرقم الجوال: ${formData.phone}`,
        department: 'الدعم الفني',
        customerName: formData.name || 'زائر',
        userPlan: 'زائر',
        status: 'مفتوحة',
        assignedAgent: 'غير معين',
        createdAt: new Date().toISOString(),
        slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
      localStorage.setItem('supportTickets', JSON.stringify([newTicket, ...tickets]));
    } catch(e) {}

    setIsSuccess(true);
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    setTimeout(() => setIsSuccess(false), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col" dir="rtl">
      <Header />
      <main className="flex-grow max-w-7xl mx-auto px-4 md:px-6 w-full py-16">
        
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-blue-950 mb-4">يسعدنا تواصلك معنا</h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">فريق خدمة العملاء متواجد دائماً للرد على استفساراتك ومساعدتك في كل ما تحتاجه.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <h3 className="text-xl font-bold text-blue-950 mb-6 border-r-4 border-amber-500 pr-3">معلومات التواصل</h3>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4 text-slate-600">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-bold text-blue-950 mb-1">رقم الهاتف</p>
                    {platformData.phones ? platformData.phones.split(/[,،\n]/).filter(Boolean).map((phone: string, i: number) => (
                      <p key={i} dir="ltr" className="text-right">{phone.trim()}</p>
                    )) : null}
                  </div>
                </div>

                <div className="flex items-start gap-4 text-slate-600">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-bold text-blue-950 mb-1">البريد الإلكتروني</p>
                    {platformData.emails ? platformData.emails.split(/[,،\n]/).filter(Boolean).map((email: string, i: number) => (
                      <p key={i} dir="ltr" className="text-right">{email.trim()}</p>
                    )) : null}
                  </div>
                </div>

                <div className="flex items-start gap-4 text-slate-600">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-bold text-blue-950 mb-1">العنوان</p>
                    {(platformData.address || '').split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </div>

                <div className="flex items-start gap-4 text-slate-600">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-bold text-blue-950 mb-1">ساعات العمل</p>
                    {(platformData.workingHours || '').split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 h-full">
              <h3 className="text-2xl font-bold text-blue-950 mb-2">أرسل لنا رسالة</h3>
              <p className="text-slate-500 mb-8">قم بتعبئة النموذج أدناه وسيقوم فريقنا بالرد عليك في أقرب وقت ممكن.</p>

              {isSuccess ? (
                <div className="bg-emerald-50 text-emerald-600 p-8 rounded-2xl flex flex-col items-center justify-center text-center gap-4 h-[400px]">
                  <CheckCircle2 className="w-16 h-16" />
                  <h4 className="text-2xl font-bold">تم إرسال رسالتك بنجاح!</h4>
                  <p>سنتواصل معك في أقرب وقت ممكن.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">الاسم الكامل <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                      placeholder="أدخل اسمك الكريم"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">رقم الجوال <span className="text-red-500">*</span></label>
                    <PhoneInput 
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">البريد الإلكتروني</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                      placeholder="example@domain.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">الموضوع <span className="text-red-500">*</span></label>
                    <select 
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all bg-white"
                    >
                      <option value="">اختر الموضوع</option>
                      <option value="استفسار عام">استفسار عام</option>
                      <option value="مشكلة تقنية">مشكلة في الحجز / تقنية</option>
                      <option value="اقتراح">اقتراح للتطوير</option>
                      <option value="شكوى">شكوى</option>
                      <option value="تسجيل كمزود خدمة">التسجيل كمزود خدمة</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">الرسالة <span className="text-red-500">*</span></label>
                  <textarea 
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all resize-none"
                    placeholder="اكتب رسالتك هنا..."
                  ></textarea>
                </div>

                <button 
                  type="submit"
                  className="bg-blue-950 hover:bg-blue-900 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  <Send className="w-5 h-5" /> إرسال الرسالة
                </button>
              </form>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
