import { BookingRepository } from '../booking.repository.js';
import { CustomerWallet, CustomerHeldBalance, Expense } from '../../../models/Database.js';

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

    if (status === 'approved') {
      if (booking.status !== 'cancelled') {
        await booking.update({ status: 'cancelled' });
      }

      const totalPaid = booking.totalAmount;
      amountRefunded = totalPaid;
      refundType = 'credit_held';

      const finalEmail = request.customerEmail;
      await CustomerWallet.findOrCreate({
        where: { customerEmail: finalEmail },
        defaults: { customerName: request.customerName, cashBalance: 0 }
      });

      const hall = await this.repo.findHallByPk(booking.hallId);
      const providerId = hall?.providerId ? Number(hall.providerId) : (hall?.provider ? Number(hall.provider.replace('provider_', '')) : 1);

      await CustomerHeldBalance.create({
        customerEmail: finalEmail,
        customerName: request.customerName,
        amount: totalPaid,
        originalBookingId: booking.id,
        originalProviderId: providerId,
        holdReason: 'force_majeure',
        heldSince: new Date(),
        conversionStatus: 'held',
        approvedByAdmin: 'نظام التدقيق الإداري والمطالبات المعتمدة',
        notes: `رصيد قوة قاهرة مجدول (قسيمة ائتمانية مؤجلة) بموافقة الإدارة لحساب حجز رقم #${booking.id}`
      });

      await Expense.create({
        title: `قسيمة جدولة رصيد قوة قاهرة للعميل لحساب حجز #${booking.id} - ${booking.customerName}`,
        amount: totalPaid / 1.15,
        vatAmount: totalPaid - (totalPaid / 1.15),
        amountIncludingVat: totalPaid,
        category: String(providerId),
        paymentMethod: 'credit_held',
        status: 'paid',
        EmployeeId: 1,
        type: 'refund'
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
      io.emit("force_majeure_resolved", { id, status, request });
    }

    return {
      success: true,
      message: status === 'approved' ? 'تمت الموافقة على الطلب بنجاح وإصدار قسيمة رصيد مالي للعميل.' : 'تم رفض الطلب بنجاح وإغلاق التذكرة.',
      request
    };
  }
}
