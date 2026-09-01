import { Op } from 'sequelize';
import { BookingRepository } from '../booking.repository.js';
import {
  deductLoyaltyPointsForCancelledBooking
} from '../booking.helpers.js';
import { User, PlatformConfig } from '../../../models/UserModels.js';
import { RefundOrchestrator } from '../../../services/finance/RefundOrchestrator.js';

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

    let refundResult: any = null;

    // التنفيذ المالي الموحد عبر المحرك السيادي فقط عند إلغاء حجز مؤكد أو مدفوع
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

      // استدعاء المسار المالي الموحد السيادي (Canonical Financial Refund Flow)
      refundResult = await RefundOrchestrator.processBookingCancellationRefund({
        booking,
        cancelledBy: 'customer',
        userEmail: finalEmail,
        reason: req?.body?.reason || `إلغاء حجز #${booking.id} من قبل العميل`,
        eventStartTime: booking.startTime,
        listingCancellationPeriod,
        reconciliationModel
      });
    }

    // تحديث الحالة التشغيلية للحجز
    await booking.update({ status: 'cancelled' });
    await deductLoyaltyPointsForCancelledBooking(booking);

    const cashRefunded = refundResult?.snapshot?.refundedCustomerAmount ? (refundResult.snapshot.refundedCustomerAmount / 100) : 0;
    const creditHeld = refundResult?.snapshot?.retainedProviderAmount ? 0 : 0;

    if (io) {
      io.emit("booking_cancelled_event", {
        bookingId: id,
        amountRefunded: cashRefunded,
        amountCredited: creditHeld,
        customerEmail: finalEmail
      });
    }

    return {
      success: true,
      message: `تم إلغاء الحجز بنجاح ومعالجة الاسترداد المالي والقيود المحاسبية عبر المحرك المالي السيادي الموحد.`,
      booking,
      refundDetail: {
        cashAmount: cashRefunded,
        creditAmount: creditHeld,
        customerEmail: finalEmail,
        refundId: refundResult?.refundId || null,
        journalId: refundResult?.journal?.id || null
      }
    };
  }
}
