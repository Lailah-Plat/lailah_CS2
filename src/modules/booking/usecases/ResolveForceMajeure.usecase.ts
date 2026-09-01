import { BookingRepository } from '../booking.repository.js';
import { RefundOrchestrator } from '../../../services/finance/RefundOrchestrator.js';

export class ResolveForceMajeureUseCase {
  constructor(private repo: BookingRepository) {}

  async execute(id: string, status: string, adminNotes: string | undefined, io: any) {
    if (!['approved', 'rejected'].includes(status)) {
      const error: any = new Error('حالة الاسترداد غير صالحة.');
      error.status = 400;
      throw error;
    }

    const request = await this.repo.findForceMajeureRequestByPk(id);
    if (!request) {
      const error: any = new Error('الطلب المحدد غير موجود.');
      error.status = 404;
      throw error;
    }

    if (request.status !== 'pending') {
      const error: any = new Error('تم اتخاذ قرار مسبقاً بشأن هذا الطلب.');
      error.status = 400;
      throw error;
    }

    const booking = await this.repo.findBookingByPk(request.bookingId);
    if (!booking) {
      const error: any = new Error('الحجز المرتبط بالطلب غير موجود في النظام.');
      error.status = 404;
      throw error;
    }

    let refundType = 'none';
    let amountRefunded = 0;
    let refundResult: any = null;

    if (status === 'approved') {
      if (booking.status !== 'cancelled') {
        await booking.update({ status: 'cancelled' });
      }

      const totalPaid = booking.totalAmount;
      amountRefunded = totalPaid;
      refundType = 'credit_held';

      // استدعاء محرك الاسترداد المالي الموحد السيادي
      refundResult = await RefundOrchestrator.processForceMajeureRefund({
        bookingId: booking.id,
        customerEmail: request.customerEmail,
        customerName: request.customerName,
        totalAmountSar: totalPaid,
        adminNotes: adminNotes || 'اعتماد رسمي لطلب قوة قاهرة'
      });
    }

    await request.update({
      status,
      adminNotes: adminNotes || '',
      amountRefunded,
      refundType,
      resolvedAt: new Date()
    });

    if (io) {
      io.emit("force_majeure_resolved", { id, status, request, refund: refundResult?.refund || null });
    }

    return {
      success: true,
      message: status === 'approved' ? 'تمت الموافقة على الطلب بنجاح وإصدار قسيمة رصيد مالي للعميل عبر المحرك المالي السيادي.' : 'تم رفض الطلب بنجاح وإغلاق التذكرة.',
      request,
      refund: refundResult?.refund || null
    };
  }
}
