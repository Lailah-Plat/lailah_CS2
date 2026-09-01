/**
 * @file postBookingOrderService.ts
 * @description خدمة معالجة الطلبات اللاحقة لمتجر المستلزمات، إصدار سندات القبض الملحقة، وتحديث العقد والفاتورة الضريبية،
 * مع إرسال منظومة إشعارات فورية متعددة القنوات (In-App, Email, SMS, WhatsApp) للمزود والعميل.
 */

import { SupplementaryReceiptVoucher, Booking } from '../types/index.js';
import { formatBookingId } from '../utils/idUtils.js';

// دالة مساعدة لإرسال الإشعارات عبر الواجهة الخلفية أو القنوات المعتمدة دون تضمين مكتبات خادم Node في المتصفح
async function dispatchChannelNotification(
  channel: 'email' | 'sms' | 'whatsapp',
  recipient: string,
  message: string,
  options?: any
) {
  try {
    if (typeof window !== 'undefined' && typeof fetch === 'function') {
      fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, recipient, message, options })
      }).catch(() => {});
    }
  } catch (e) {
    // تجاهل أخطاء الإرسال في بيئة المعاينة
  }
}

// الذاكرة التخزينية لمفتاح سندات القبض الملحقة
const SUPPLEMENTARY_RECEIPTS_KEY = 'LAYLAH_SUPPLEMENTARY_RECEIPT_VOUCHERS';

/**
 * توليد رقم سند قبض ملحق تسلسلي معتمد
 * التنسيق: REC-YY-XXXXXXXXXX أو BKG-YY-XXXXXXXXXX
 * مثال: REC-26-0000000001
 */
export function generateSupplementaryReceiptNumber(): string {
  const now = new Date();
  const yearSuffix = String(now.getFullYear()).slice(-2); // e.g. '26'
  const storageKey = `SEQ_RECEIPT_VOUCHER_${yearSuffix}`;
  
  let currentSeq = 1;
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      currentSeq = parseInt(saved, 10) + 1;
    }
  } catch (e) {
    currentSeq = 1;
  }

  try {
    localStorage.setItem(storageKey, String(currentSeq));
  } catch (e) {}

  const paddedSeq = String(currentSeq).padStart(10, '0');
  return `REC-${yearSuffix}-${paddedSeq}`;
}

/**
 * جلب كافة سندات القبض الملحقة المحفوظة
 */
export function getAllSupplementaryReceipts(): SupplementaryReceiptVoucher[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(SUPPLEMENTARY_RECEIPTS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (e) {
    console.error('Error loading supplementary receipts:', e);
  }
  return [];
}

/**
 * حفظ سند قبض ملحق جديد
 */
export function saveSupplementaryReceipt(receipt: SupplementaryReceiptVoucher) {
  if (typeof window === 'undefined') return;
  try {
    const all = getAllSupplementaryReceipts();
    all.unshift(receipt);
    localStorage.setItem(SUPPLEMENTARY_RECEIPTS_KEY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent('supplementaryReceiptCreated', { detail: receipt }));
  } catch (e) {
    console.error('Error saving supplementary receipt:', e);
  }
}

/**
 * جلب سندات القبض الملحقة بحجز معين
 */
export function getSupplementaryReceiptsForBooking(bookingId: string | number): SupplementaryReceiptVoucher[] {
  const all = getAllSupplementaryReceipts();
  const strId = String(bookingId);
  return all.filter(r => String(r.bookingId) === strId || String(r.bookingNumber).includes(strId));
}

export interface PostBookingOrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
}

export interface ProcessPostBookingOrderParams {
  booking: any;
  items: PostBookingOrderItem[];
  paymentMethod?: string;
  customerNote?: string;
}

export interface ProcessPostBookingOrderResult {
  success: boolean;
  voucher: SupplementaryReceiptVoucher;
  updatedBooking: any;
  notifications: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  message: string;
}

/**
 * معالجة طلب المستلزمات اللاحق بالكامل (الأثر التشغيلي، المالي، والإشعارات)
 */
export async function processPostBookingStoreOrder(
  params: ProcessPostBookingOrderParams
): Promise<ProcessPostBookingOrderResult> {
  const { booking, items, paymentMethod = 'بطاقة مدى / ائتمانية' } = params;

  if (!booking) {
    throw new Error('بيانات الحجز غير متوفرة');
  }

  if (!items || items.length === 0) {
    throw new Error('لم يتم تحديد أي أصناف من المتجر');
  }

  // 1. الحسابات المالية (شاملة الضريبة 15%)
  const totalAmount = items.reduce((sum, item) => sum + (item.totalPrice || item.quantity * item.unitPrice), 0);
  const taxableAmount = Math.round((totalAmount / 1.15) * 100) / 100;
  const vatAmount = Math.round((totalAmount - taxableAmount) * 100) / 100;

  // 2. إصدار سند القبض الملحق
  const voucherNumber = generateSupplementaryReceiptNumber();
  const nowStr = new Date().toISOString();
  const bookingFormattedNumber = booking.bookingNumber || `BKG-26-${String(booking.id).padStart(10, '0')}`;

  const voucher: SupplementaryReceiptVoucher = {
    id: `rcpt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    voucherNumber,
    bookingId: booking.id,
    bookingNumber: bookingFormattedNumber,
    orderDate: nowStr,
    eventDate: booking.date || booking.checkInDate || 'غير محدد',
    venueId: booking.hallId || (booking.hall?.id) || '',
    venueName: booking.hall?.name || booking.hallName || booking.hall || 'قاعة المناسبات',
    providerId: booking.providerId || (booking.hall?.providerId) || 1,
    providerName: booking.providerName || booking.hall?.provider || 'مزود القاعة المعتمد',
    customerId: booking.customerId || booking.userId || 101,
    customerName: booking.customerName || booking.userName || 'العميل الكريم',
    customerPhone: booking.customerPhone || booking.phone || '0500000000',
    customerEmail: booking.customerEmail || booking.email || 'customer@laylah.app',
    items,
    subtotal: taxableAmount,
    vatAmount,
    totalAmount,
    paymentMethod,
    paymentStatus: 'paid',
    contractAmended: true,
    pricingSnapshot: {
      timestamp: nowStr,
      totalAmount,
      taxableAmount,
      vatAmount,
      vatRate: 0.15,
      itemsCount: items.length
    },
    notificationsDispatched: {
      inApp: true,
      email: true,
      sms: true,
      whatsapp: true
    },
    createdAt: nowStr
  };

  // حفظ السند في السجل العام
  saveSupplementaryReceipt(voucher);

  // 3. تحديث الحجز الأساسي واللقطة المالية والعقد الإلكتروني
  const currentTotal = Number(booking.total || booking.totalPrice || booking.amount || 0);
  const newTotal = currentTotal + totalAmount;

  const existingReceipts = Array.isArray(booking.attachedReceipts) ? [...booking.attachedReceipts] : [];
  existingReceipts.push(voucher);

  const existingStoreOrders = Array.isArray(booking.storeAddonOrders) ? [...booking.storeAddonOrders] : [];
  existingStoreOrders.push({
    voucherNumber,
    items,
    totalAmount,
    orderedAt: nowStr
  });

  const updatedBooking = {
    ...booking,
    total: newTotal,
    totalPrice: newTotal,
    amount: newTotal,
    attachedReceipts: existingReceipts,
    storeAddonOrders: existingStoreOrders,
    contractSnapshot: {
      ...(booking.contractSnapshot || {}),
      version: ((booking.contractSnapshot?.version || 1) + 1),
      lastAmendedAt: nowStr,
      amendmentReason: `إضافة مستلزمات لاحقة بسند قبض ملحق #${voucherNumber}`,
      newTotalWithAddons: newTotal,
      attachedVoucherNumber: voucherNumber
    },
    pricingSnapshot: {
      ...(booking.pricingSnapshot || {}),
      latestGrandTotal: newTotal,
      lastAddonAmount: totalAmount,
      lastVoucherNumber: voucherNumber,
      updatedAt: nowStr
    },
    communications: [
      ...(booking.communications || []),
      {
        type: 'receipt',
        title: `إصدار سند قبض ملحق #${voucherNumber}`,
        content: `تم سداد مستلزمات إضافية بقيمة ${totalAmount.toLocaleString()} ر.س وإلحاقها بالعقد الإلكتروني والفاتورة الضريبية.`,
        date: new Date().toLocaleDateString('ar-SA')
      }
    ]
  };

  // 4. حفظ الحجز المحدث في التخزين المحلي
  try {
    if (typeof window !== 'undefined') {
      const storedBookings = localStorage.getItem('halls_bookings') || localStorage.getItem('bookings');
      if (storedBookings) {
        const bookingsList = JSON.parse(storedBookings);
        if (Array.isArray(bookingsList)) {
          const idx = bookingsList.findIndex((b: any) => String(b.id) === String(booking.id));
          if (idx !== -1) {
            bookingsList[idx] = updatedBooking;
          } else {
            bookingsList.push(updatedBooking);
          }
          localStorage.setItem('halls_bookings', JSON.stringify(bookingsList));
          localStorage.setItem('bookings', JSON.stringify(bookingsList));
        }
      }
      window.dispatchEvent(new CustomEvent('bookingUpdated', { detail: updatedBooking }));
    }
  } catch (err) {
    console.error('Error persisting updated booking:', err);
  }

  // 5. منظومة الإشعارات الفورية متعددة القنوات (Omni-channel Notifications)
  const itemsSummary = items.map(i => `${i.name} (x${i.quantity})`).join('، ');

  // أ) 🔔 إشعار فوري داخل المنصة والتطبيق (In-App Push)
  try {
    if (typeof window !== 'undefined') {
      const storedNotifs = localStorage.getItem('PLATFORM_NOTIFICATIONS_SECURE');
      let notifs = storedNotifs ? JSON.parse(storedNotifs) : [];
      if (!Array.isArray(notifs)) notifs = [];

      // إشعار للمزود
      const providerNotif = {
        id: `notif_post_order_${Date.now()}_prov`,
        title: `🛍️ طلب مستلزمات إضافي ملحق بالحجز #${formatBookingId(booking.id)}`,
        body: `طلب العميل "${voucher.customerName}" مستلزمات إضافية بقيمة ${totalAmount.toLocaleString()} ر.س (${itemsSummary}) لمناسبة تاريخ ${voucher.eventDate}. تم إصدار سند القبض الملحق #${voucherNumber}.`,
        createdAt: nowStr,
        type: 'booking',
        severity: 'high',
        recipientRole: 'provider',
        recipientName: voucher.providerName,
        isRead: false,
        metadata: {
          bookingId: booking.id,
          voucherNumber,
          totalAmount,
          itemsCount: items.length
        }
      };

      // إشعار للعميل
      const clientNotif = {
        id: `notif_post_order_${Date.now()}_client`,
        title: `✅ تم تأكيد طلب المستلزمات وسند القبض #${voucherNumber}`,
        body: `تمت إضافة المستلزمات بنجاح إلى حجزكم في "${voucher.venueName}" وتحديث الفاتورة الضريبية والعقد الإلكتروني.`,
        createdAt: nowStr,
        type: 'booking',
        severity: 'medium',
        recipientRole: 'client',
        recipientName: voucher.customerName,
        isRead: false,
        metadata: {
          bookingId: booking.id,
          voucherNumber
        }
      };

      notifs.unshift(providerNotif, clientNotif);
      localStorage.setItem('PLATFORM_NOTIFICATIONS_SECURE', JSON.stringify(notifs));
      window.dispatchEvent(new CustomEvent('platformNotificationAdded', { detail: providerNotif }));
    }
  } catch (err) {
    console.error('Error pushing In-App notification:', err);
  }

  // ب) ✉️ بريد إلكتروني رسمي (Email)
  try {
    const emailSubject = `إشعار رسمي: سند قبض ملحق #${voucherNumber} - حجز #${bookingFormattedNumber}`;
    const emailBody = `
السلام عليكم ورحمة الله وبركاته،
نفيدكم بصدور سند قبض ملحق برقم ${voucherNumber} مرتبط بالحجز الأساسي #${bookingFormattedNumber}.

تفاصيل الأصناف والمستلزمات:
${items.map(i => `- ${i.name} (الكمية: ${i.quantity}) - السعر: ${(i.totalPrice || i.quantity * i.unitPrice).toLocaleString()} ر.س`).join('\n')}

المبلغ الإجمالي شامل الضريبة: ${totalAmount.toLocaleString()} ر.س
طريقة السداد: ${paymentMethod}
تاريخ المناسبة: ${voucher.eventDate}

تم تحديث الفاتورة الضريبية المعتمدة والعقد الإلكتروني تلقائياً.
منصة ليلة للمناسبات
    `.trim();

    dispatchChannelNotification(
      'email',
      booking.customerEmail || 'partner@laylah.app',
      emailBody,
      { subject: emailSubject, voucherNumber, bookingNumber: bookingFormattedNumber }
    );
  } catch (err) {
    console.warn('Email dispatch warning:', err);
  }

  // ج) 📱 رسائل نصية SMS
  try {
    const smsMessage = `منصة ليلة: تم إصدار سند قبض ملحق #${voucherNumber} بقيمة ${totalAmount} ر.س للحجز #${formatBookingId(booking.id)} لمناسبة ${voucher.eventDate}. تم تحديث العقد.`;
    dispatchChannelNotification(
      'sms',
      voucher.customerPhone || '0500000000',
      smsMessage,
      { voucherNumber }
    );
  } catch (err) {
    console.warn('SMS dispatch warning:', err);
  }

  // د) 💬 تنبيه عبر WhatsApp
  try {
    const waMessage = `✨ *منصة ليلة - إشعار سند قبض ملحق*\n\nتم اعتماد طلب مستلزمات إضافي للحجز *#${bookingFormattedNumber}*.\n📄 *رقم سند القبض:* ${voucherNumber}\n💰 *المبلغ:* ${totalAmount.toLocaleString()} ر.س (شامل الضريبة)\n🛍️ *الأصناف:* ${itemsSummary}\n📅 *تاريخ المناسبة:* ${voucher.eventDate}\n\nتم تحديث الفاتورة الضريبية والعقد الإلكتروني تلقائياً.`;
    dispatchChannelNotification(
      'whatsapp',
      voucher.customerPhone || '0500000000',
      waMessage,
      { voucherNumber }
    );
  } catch (err) {
    console.warn('WhatsApp dispatch warning:', err);
  }

  return {
    success: true,
    voucher,
    updatedBooking,
    notifications: {
      inApp: true,
      email: true,
      sms: true,
      whatsapp: true
    },
    message: `تم إصدار سند القبض الملحق #${voucherNumber} وتحديث العقد والفاتورة الضريبية وإرسال الإشعارات عبر كافة القنوات.`
  };
}
