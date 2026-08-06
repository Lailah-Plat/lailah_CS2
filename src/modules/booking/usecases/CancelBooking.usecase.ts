import { Op } from 'sequelize';
import { BookingRepository } from '../booking.repository.js';
import {
  deductLoyaltyPointsForCancelledBooking
} from '../booking.helpers.js';
import { Wallet, WalletTransaction, CustomerWallet, CustomerHeldBalance, Expense } from '../../../models/Database.js';
import { User, PlatformConfig } from '../../../models/UserModels.js';

export class CancelBookingUseCase {
  constructor(private repo: BookingRepository) {}

  async execute(id: string, userEmail: string | undefined, io: any, req: any) {
    const booking = await this.repo.findBookingByPk(id);
    if (!booking) {
      const error: any = new Error('الحجز غير موجود');
      error.status = 404;
      throw error;
    }

    if (booking.status === 'cancelled') {
      return { message: 'الحجز ملغى بالفعل', booking };
    }

    if (booking.status === 'completed') {
      const error: any = new Error('عذراً، لا يمكن إلغاء الحجوزات المكتملة أو منتهية الصلاحية.');
      error.status = 400;
      throw error;
    }

    const previousStatus = booking.status;

    const hall = await this.repo.findHallByPk(booking.hallId);
    const providerId = hall?.providerId ? Number(hall.providerId) : (hall?.provider ? Number(hall.provider.replace('provider_', '')) : 1);
    const listingCancellationPeriod = (hall && hall.cancellationPeriod !== undefined) ? hall.cancellationPeriod : null;

    let finalEmail = userEmail || '';
    if (!finalEmail) {
      const matchedUser = await User.findOne({
        where: {
          [Op.or]: [
            { phone: booking.customerPhone },
            { name: booking.customerName }
          ]
        }
      });
      if (matchedUser) {
        finalEmail = matchedUser.email;
      } else {
        finalEmail = booking.customerPhone ? `${booking.customerPhone}@lailah.customer` : 'customer@lailah.customer';
      }
    }

    let refundOutcomeMessage = 'تم إلغاء الحجز بنجاح.';
    let cashAmount = 0;
    let creditAmount = 0;

    const [cWallet] = await CustomerWallet.findOrCreate({
      where: { customerEmail: finalEmail },
      defaults: { customerName: booking.customerName, cashBalance: 0 }
    });

    if (previousStatus === 'confirmed') {
      let reconciliationModel: 'hybrid' | 'binary' = 'hybrid';
      try {
        const config = await PlatformConfig.findByPk('SYSTEM_FINANCIAL_SETTINGS');
        if (config) {
          const parsed = JSON.parse(config.value);
          if (parsed && parsed.refundReconciliationModel) {
            reconciliationModel = parsed.refundReconciliationModel;
          }
        }
      } catch (err) {
        console.error('Error fetching SYSTEM_FINANCIAL_SETTINGS:', err);
      }

      const cancelTime = new Date();
      const bookingConfirmationTime = booking.createdAt || new Date();
      const eventStartTime = booking.startTime;

      const diffMs = eventStartTime.getTime() - cancelTime.getTime();
      const daysRemaining = diffMs / (1000 * 60 * 60 * 24);

      const diffConfirmationMs = cancelTime.getTime() - bookingConfirmationTime.getTime();
      const confirmedHoursAgo = diffConfirmationMs / (1000 * 60 * 60);

      const timeToEventFromBookingMs = eventStartTime.getTime() - bookingConfirmationTime.getTime();
      const hoursToEventFromBooking = timeToEventFromBookingMs / (1000 * 60 * 60);

      const isGraceWindowEligible = confirmedHoursAgo <= 24 && hoursToEventFromBooking >= 72;

      let cashPercent = 0;
      let creditPercent = 0;
      let calcReason = '';

      if (isGraceWindowEligible) {
        cashPercent = 100;
        creditPercent = 0;
        calcReason = 'نافذة سماح الـ 24 ساعة للإلغاء بعد تأكيد الحجز (استرداد كامل)';
      } else {
        const effectiveListingPeriod = (listingCancellationPeriod !== null && listingCancellationPeriod >= 0)
          ? listingCancellationPeriod
          : 14;

        if (reconciliationModel === 'binary') {
          if (listingCancellationPeriod !== null) {
            if (daysRemaining >= listingCancellationPeriod) {
              cashPercent = 100;
              creditPercent = 0;
              calcReason = 'الإلغاء قبل مهلة إلغاء القاعة (النموذج القاطع - استرداد كامل)';
            } else {
              cashPercent = 0;
              creditPercent = 0;
              calcReason = 'الإلغاء بعد تجاوز مهلة إلغاء القاعة (النموذج القاطع - لا يوجد استرداد)';
            }
          } else {
            if (daysRemaining >= 15) {
              cashPercent = 100;
              creditPercent = 0;
              calcReason = 'سياسة المنصة العامة: متبقي أكثر من 15 يوماً (استرداد كاش)';
            } else if (daysRemaining >= 7) {
              cashPercent = 0;
              creditPercent = 75;
              calcReason = 'سياسة المنصة العامة: متبقي 7 - 14 يوماً (رصيد جدولة 75٪)';
            } else if (daysRemaining >= 4) {
              cashPercent = 0;
              creditPercent = 50;
              calcReason = 'سياسة المنصة العامة: متبقي 4 - 6 أيام (رصيد جدولة 50٪)';
            } else {
              cashPercent = 0;
              creditPercent = 0;
              calcReason = 'سياسة المنصة العامة: متبقي أقل من 3 أيام (لا يوجد استرداد)';
            }
          }
        } else {
          if (daysRemaining >= effectiveListingPeriod) {
            cashPercent = 100;
            creditPercent = 0;
            calcReason = 'قبل المهلة المحددة للقاعة (نموذج هجين - استرداد كلي 100٪)';
          } else {
            if (daysRemaining >= 15) {
              cashPercent = 100;
              creditPercent = 0;
              calcReason = 'طبيعة المنصة الهجينة: بقاء أكثر من 15 يوماً (استرداد كامل)';
            } else if (daysRemaining >= 7) {
              cashPercent = 0;
              creditPercent = 75;
              calcReason = 'طبيعة المنصة الهجينة: متبقي 7 - 14 يوماً (رصيد جدولة 75٪)';
            } else if (daysRemaining >= 4) {
              cashPercent = 0;
              creditPercent = 50;
              calcReason = 'طبيعة المنصة الهجينة: متبقي 4 - 6 أيام (رصيد جدولة 50٪)';
            } else {
              cashPercent = 0;
              creditPercent = 0;
              calcReason = 'طبيعة المنصة الهجينة: بقاء أقل من 3 أيام على الموعد (لا يوجد استرداد)';
            }
          }
        }
      }

      cashAmount = (booking.totalAmount * cashPercent) / 100;
      creditAmount = (booking.totalAmount * creditPercent) / 100;

      refundOutcomeMessage = `تم معالجة الإلغاء بدقة وفق نموذج الحساب النشط (${calcReason}). `;

      if (cashAmount > 0) {
        const [pWallet] = await Wallet.findOrCreate({
          where: { providerId },
          defaults: { balance: 0, pendingBalance: 0 }
        });

        await pWallet.update({
          balance: Math.max(0, pWallet.balance - cashAmount)
        });

        await cWallet.update({
          cashBalance: cWallet.cashBalance + cashAmount
        });

        await WalletTransaction.create({
          providerId,
          type: 'refund',
          description: `استرداد نقدي تلقائي للعميل لحساب حجز ملغي رقم #${booking.id}`,
          amount: cashAmount,
          status: 'completed'
        });

        await Expense.create({
          title: `استرداد مالي تلقائي لحجز ملغي #${booking.id} - ${booking.customerName}`,
          amount: cashAmount / 1.15,
          vatAmount: cashAmount - (cashAmount / 1.15),
          amountIncludingVat: cashAmount,
          category: String(providerId),
          paymentMethod: 'refund',
          status: 'paid',
          EmployeeId: 1,
          type: 'refund'
        });
      }

      if (creditAmount > 0) {
        await CustomerHeldBalance.create({
          customerEmail: finalEmail,
          customerName: booking.customerName,
          amount: creditAmount,
          originalBookingId: booking.id,
          originalProviderId: providerId,
          holdReason: 'rescheduling',
          heldSince: new Date(),
          conversionStatus: 'held',
          notes: `رصيد جدولة مالي مستحق بنسبة ${creditPercent}% لحساب الحجز الملغي #${booking.id}`
        });

        await Expense.create({
          title: `رصيد جدولة مالي مستحق للعميل لحساب حجز ملغي #${booking.id} - ${booking.customerName}`,
          amount: creditAmount / 1.15,
          vatAmount: creditAmount - (creditAmount / 1.15),
          amountIncludingVat: creditAmount,
          category: String(providerId),
          paymentMethod: 'credit',
          status: 'paid',
          EmployeeId: 1,
          type: 'refund'
        });
      }
    }

    await booking.update({ status: 'cancelled' });
    await deductLoyaltyPointsForCancelledBooking(booking);

    if (io) {
      io.emit("booking_cancelled_event", {
        bookingId: id,
        amountRefunded: cashAmount,
        amountCredited: creditAmount,
        customerEmail: finalEmail
      });
    }

    return {
      success: true,
      message: `${refundOutcomeMessage} تم إلغاء الحجز وتحديث الرصيد التلقائي للعميل بنجاح 💸. النقد المسترد: ${cashAmount} ر.س | رصيد الجدولة المحجوز: ${creditAmount} ر.س.`,
      booking,
      refundDetail: {
        cashAmount,
        creditAmount,
        customerEmail: finalEmail
      }
    };
  }
}
