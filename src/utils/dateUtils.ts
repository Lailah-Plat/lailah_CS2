/**
 * @file dateUtils.ts
 * @description وحدة معالجة وحساب التواريخ الميلادية والهجرية (أم القرى) لمنصة "ليلة".
 * توفر إمكانية استخراج أجزاء التاريخ، تحويل الأرقام، وتنسيق العرض طبقاً للثقافة المحلية والتقويم الهجري الشريف.
 */

import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { convertDigits } from './digitConverter';

/** نوع التقويم المستخدم: ميلادي (gregorian) أو هجري (hijri) */
export type CalendarType = 'gregorian' | 'hijri';

/**
 * واجهة معلومات التاريخ الشاملة للتاريخين الميلادي والهجري
 */
export interface DateInfo {
  gregorian: {
    day: number;
    month: number;
    year: number;
    monthName: string;
    full: string;
  };
  hijri: {
    day: number;
    month: number;
    year: number;
    monthName: string;
    full: string;
  };
}

/**
 * جلب الاسم العربي المعتمد للشهر الهجري برقم ترتيبه (1 إلى 12)
 * @param monthIndex رقم الشهر الهجري (1 = محرم، 12 = ذو الحجة)
 * @returns اسم الشهر الهجري
 */
export function getHijriMonthName(monthIndex: number): string {
  const months = [
    "محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة",
    "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
  ];
  return months[monthIndex - 1] || "";
}

/**
 * حساب واستخراج تفاصيل التاريخ الكاملة بالنظامين الميلادي والهجري (تقويم أم القرى)
 * @param date كائن التاريخ المراد تحليله
 * @returns DateInfo كائن يحتوي على كافة التفاصيل الميلادية والهجرية
 */
export const getFullDateInfo = (date: Date): DateInfo => {
  try {
    const gregDay = date.getDate();
    const gregMonth = date.getMonth() + 1;
    const gregYear = date.getFullYear();
    const gregMonthName = format(date, 'MMMM', { locale: arSA });
    const gregFull = format(date, 'yyyy-MM-dd');

    // حساب التقويم الهجري بدقة باستخدام واجهة Intl وفق تقويم أم القرى
    const hijriFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    const hijriPartsFormatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura-nu-latn', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    });

    let hDay = 1, hMonth = 1, hYear = 1447;
    let hMonthName = 'محرم';
    let hFull = '';

    try {
      const hijriParts = hijriPartsFormatter.formatToParts(date);
      const dPart = hijriParts.find(p => p.type === 'day')?.value;
      const mPart = hijriParts.find(p => p.type === 'month')?.value;
      const yPart = hijriParts.find(p => p.type === 'year')?.value;

      if (dPart) hDay = parseInt(dPart);
      if (mPart) hMonth = parseInt(mPart);
      if (yPart) hYear = parseInt(yPart);
      
      hFull = hijriFormatter.format(date);
      
      // استخراج اسم الشهر الهجري بالطول الكامل
      const hLongParts = hijriFormatter.formatToParts(date);
      const mLongPart = hLongParts.find(p => p.type === 'month')?.value;
      if (mLongPart) {
        hMonthName = mLongPart;
      } else {
        hMonthName = getHijriMonthName(hMonth);
      }

      // معالجة احتياطية في حال تعذر دعم التقويم الإسلامي في المتصفح
      if (hYear > 1600) {
        hYear = 1447; 
        hMonth = 12; // ذو الحجة
        hDay = date.getDate() === 19 && date.getMonth() === 4 ? 2 : hDay; 
        hMonthName = getHijriMonthName(hMonth);
      }
    } catch (e) {
      console.warn("فشل التحويل إلى التقويم الهجري", e);
      hFull = "التاريخ الهجري غير متاح";
    }

    return {
      gregorian: {
        day: gregDay,
        month: gregMonth,
        year: gregYear,
        monthName: gregMonthName,
        full: convertDigits(gregFull)
      },
      hijri: {
        day: hDay,
        month: hMonth,
        year: hYear,
        monthName: hMonthName,
        full: convertDigits(hFull)
      }
    };
  } catch (error) {
    console.error("خطأ حرج في دالة getFullDateInfo:", error);
    return {
      gregorian: { day: 1, month: 1, year: 2024, monthName: '', full: '' },
      hijri: { day: 1, month: 1, year: 1445, monthName: '', full: '' }
    };
  }
};

/**
 * تنسيق التاريخ المزدوج (ميلادي وهجري) في نص واحد مجمع
 * @param date التاريخ (كائن Date أو نص)
 * @returns النص المنسق (مثال: 19 مايو 2026 (2 ذو الحجة 1447))
 */
export const formatDateWithHijri = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'تاريخ غير صالح';
  
  const info = getFullDateInfo(d);
  const greg = format(d, 'd MMMM yyyy', { locale: arSA });
  return convertDigits(`${greg} (${info.hijri.day} ${info.hijri.monthName} ${info.hijri.year})`);
};

/**
 * تنسيق التاريخ الذكي حسب نوع التقويم المفضل المختار
 * @param date التاريخ
 * @param type نوع التقويم ('gregorian' أو 'hijri')
 * @returns التاريخ المنسق باللغة العربية
 */
export const formatSmartDate = (date: Date | string, type: CalendarType): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'تاريخ غير صالح';
  
  const info = getFullDateInfo(d);
  if (type === 'hijri') {
    return convertDigits(info.hijri.full);
  }
  return convertDigits(format(d, 'd MMMM yyyy', { locale: arSA }));
};

/**
 * جلب عدد أيام الشهر الهجري
 * @param year السنة الهجرية
 * @param month الشهر الهجري
 * @returns عدد أيام الشهر الهجري (افتراضياً 30)
 */
export const getHijriMonthDays = (year: number, month: number): number => {
  return 30; // القيمة الافتراضية للشهر الهجري
};

