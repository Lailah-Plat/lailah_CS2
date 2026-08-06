/**
 * @file digitConverter.ts
 * @description وحدة تحويل الأرقام بين النظامين المشرقي (الأرقام الهندية/العربية الشرقية) والمغربي (الأرقام العربية الغربية).
 * تضمن هذه الوحدة اتساق عرض الأرقام عبر جميع واجهات منصة "ليلة" طبقاً لتفضيل المستخدم.
 */

/**
 * جلب نمط عرض الأرقام المفضل الحالي من التخزين المحلي
 * @returns 'western' (الأرقام العربية/الإنجليزية: 1,2,3) أو 'eastern' (الأرقام الهندية/الشرقية: ١,٢,٣)
 */
export const getDigitStyle = (): 'western' | 'eastern' => {
  const style = localStorage.getItem('APP_DIGIT_STYLE');
  return style === 'eastern' ? 'eastern' : 'western';
};

/**
 * تعيين نمط عرض الأرقام وإطلاق حدث مخصص لتحديث الواجهات فورياً
 * @param style نمط الأرقام المراد اعتماده ('western' أو 'eastern')
 */
export const setDigitStyle = (style: 'western' | 'eastern') => {
  localStorage.setItem('APP_DIGIT_STYLE', style);
  // إطلاق حدث مخصص لإبلاغ المكونات والواجهات بالتغيير الفوري
  window.dispatchEvent(new Event('digitStyleChanged'));
};

/**
 * تحويل الأرقام داخل النص الممرر بناءً على الخيار المفضل النشط للنظام
 * @param input النص أو الرقم أو القيمة المراد تحويل أرقامها
 * @returns النص بعد تحويل الأرقام إلى النمط المعتمد
 */
export const convertDigits = (input: string | number | null | undefined): string => {
  if (input === null || input === undefined) return '';
  const str = String(input);
  const style = getDigitStyle();

  /** خريطة تحويل الأرقام الشرقية/الهندية إلى أرقام غربية */
  const easternToWestern: { [key: string]: string } = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
  };

  /** خريطة تحويل الأرقام الغربية إلى أرقام شرقية/هندية */
  const westernToEastern: { [key: string]: string } = {
    '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤', '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩'
  };

  if (style === 'western') {
    return str.replace(/[٠-٩]/g, (e) => easternToWestern[e] || e);
  } else {
    return str.replace(/[0-9]/g, (w) => westernToEastern[w] || w);
  }
};

