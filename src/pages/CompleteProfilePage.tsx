import React, { useState, useMemo } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { User, MapPin, Building, CreditCard, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CompleteProfilePage() {
  const navigate = useNavigate();
  
  // We can derive role from local storage:
  const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const role = user?.role || 'عميل';

  const regions = useMemo(() => {
    try {
      const stored = localStorage.getItem('SYSTEM_REGIONS');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return [
      { id: 1, name: 'الرياض', cities: ['الرياض', 'الخرج', 'الدرعية'] },
      { id: 2, name: 'مكة المكرمة', cities: ['مكة', 'جدة', 'الطائف'] },
      { id: 3, name: 'المدينة المنورة', cities: ['المدينة المنورة', 'ينبع', 'بدر'] },
      { id: 4, name: 'المنطقة الشرقية', cities: ['الدمام', 'الخبر', 'الظهران', 'الجبيل'] },
      { id: 5, name: 'القصيم', cities: ['بريدة', 'عنيزة', 'الرس'] },
      { id: 6, name: 'حائل', cities: ['حائل', 'بقعاء', 'الشنان'] },
      { id: 7, name: 'عسير', cities: ['أبها', 'خميس مشيط', 'أحد رفيدة'] },
      { id: 8, name: 'تبوك', cities: ['تبوك', 'ضباء', 'الوجه'] },
      { id: 9, name: 'الجوف', cities: ['سكاكا', 'القريات', 'دومة الجندل'] },
      { id: 10, name: 'جيزان', cities: ['جيزان', 'صبيا', 'أبو عريش'] },
      { id: 11, name: 'نجران', cities: ['نجران', 'شرورة'] },
      { id: 12, name: 'الباحة', cities: ['الباحة', 'بلجرشي'] },
      { id: 13, name: 'الحدود الشمالية', cities: ['عرعر', 'رفحاء', 'طريف'] }
    ];
  }, []);

  const [form, setForm] = useState({
    region: '',
    city: '',
    addressDetails: '',
    bankName: '',
    iban: '',
    commercialRecord: ''
  });

  const isValid = 
    form.region.trim() !== '' && 
    form.city.trim() !== '' &&
    (role === 'مزود' ? (form.bankName.trim() !== '' && form.iban.trim() !== '') : true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/users/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          region: form.region,
          city: form.city,
          addressDetails: form.addressDetails,
          bankName: form.bankName,
          iban: form.iban,
          commercialRecord: form.commercialRecord
        })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'حدث خطأ أثناء حفظ البيانات بقاعدة البيانات');
        setIsSubmitting(false);
        return;
      }

      // Save to localStorage with the full updated database user
      const userAvatar = data.user?.image || data.user?.avatarUrl || data.user?.avatar || user.image || user.avatarUrl || user.avatar || user.imagePreview || '';
      const updatedUser = {
        ...user,
        ...data.user,
        image: userAvatar,
        avatar: userAvatar,
        avatarUrl: userAvatar,
        imagePreview: userAvatar,
        region: form.region,
        city: form.city,
        addressDetails: form.addressDetails,
        bankName: form.bankName,
        iban: form.iban,
        commercialRecord: form.commercialRecord
      };

      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('currentUserUpdated'));
      window.dispatchEvent(new Event('storage'));

      alert('تم استكمال تسجيل البيانات بنجاح في قاعدة البيانات والتطبيق!');
      
      if (role === 'مزود') {
        navigate('/dashboard?tab=halls');
      } else {
        navigate('/profile');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ بالاتصال بالخادم، جاري الحفظ محلياً كاحتياط');
      // Save locally as a fallback
      user.region = form.region;
      user.city = form.city;
      user.addressDetails = form.addressDetails;
      if (role === 'مزود') {
        user.bankName = form.bankName;
        user.iban = form.iban;
        user.commercialRecord = form.commercialRecord;
      }
      localStorage.setItem('currentUser', JSON.stringify(user));

      if (role === 'مزود') {
        navigate('/dashboard?tab=halls');
      } else {
        navigate('/profile');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col" dir="rtl">
      <Header />
      <main className="flex-grow flex items-center justify-center py-12 px-4">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-2xl w-full overflow-hidden">
          <div className="bg-blue-950 p-8 text-center text-white">
            <h1 className="text-3xl font-bold mb-2">استكمال الملف الشخصي</h1>
            <p className="text-blue-200">يرجى إضافة التفاصيل أدناه للبدء في استخدام المنصة</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <h3 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-500" /> العنوان والتفاصيل الجغرافية
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">المنطقة <span className="text-red-500">*</span></label>
                <select 
                  required 
                  value={form.region || ''} 
                  onChange={e => setForm({ ...form, region: e.target.value, city: '' })} 
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none bg-white font-sans text-xs sm:text-sm"
                >
                  <option value="">اختر المنطقة</option>
                  {regions.map(r => (
                    <option key={r.id || r.name} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">المدينة <span className="text-red-500">*</span></label>
                <select 
                  required 
                  value={form.city || ''} 
                  onChange={e => setForm({ ...form, city: e.target.value })} 
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none bg-white font-sans text-xs sm:text-sm"
                >
                  <option value="">اختر المدينة</option>
                  {(regions.find(r => r.name === form.region)?.cities || []).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
               <label className="block text-sm font-medium text-slate-700 mb-2">تفاصيل العنوان</label>
               <input type="text" value={form.addressDetails || ''} onChange={e => setForm({...form, addressDetails: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none" placeholder="اسم الحي، الشارع، تفاصيل أخرى..." />
            </div>

            {role === 'مزود' && (
              <>
                <h3 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-2 mt-8 flex items-center gap-2">
                  <Building className="w-5 h-5 text-amber-500" /> البيانات المالية والتجارية (خاص بالمزودين)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">اسم البنك <span className="text-red-500">*</span></label>
                    <input required type="text" value={form.bankName || ''} onChange={e => setForm({...form, bankName: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none" placeholder="مثال: البنك الأهلي" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">رقم الآيبان (IBAN) <span className="text-red-500">*</span></label>
                    <input required type="text" value={form.iban || ''} onChange={e => setForm({...form, iban: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none text-left" dir="ltr" placeholder="SA..." />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">رقم السجل التجاري (اختياري)</label>
                  <input type="text" value={form.commercialRecord || ''} onChange={e => setForm({...form, commercialRecord: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none left-align font-mono text-right" placeholder="ادخل رقم السجل" />
                </div>
              </>
            )}

            <button 
              type="submit"
              disabled={!isValid || isSubmitting}
              className={`w-full py-4 rounded-xl font-bold text-lg mt-8 transition-all flex justify-center items-center gap-2 ${
                isValid && !isSubmitting
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full border-2 border-slate-400 border-t-white animate-spin"></span>
                  جاري تسجيل وحفظ البيانات بقاعدة البيانات...
                </span>
              ) : (
                <>
                  <CheckCircle2 className="w-6 h-6" /> استكمال التسجيل
                </>
              )}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
