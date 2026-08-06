import { Op } from 'sequelize';
import { BookingRepository } from '../booking.repository.js';
import {
  calculateBookingTotal,
  awardLoyaltyPointsForBooking,
  handleReBookingForceMajeureTrigger
} from '../booking.helpers.js';
import { Booking } from '../../../models/BookingModels.js';
import { User } from '../../../models/UserModels.js';

export class CreateBookingUseCase {
  constructor(private repo: BookingRepository) {}

  async execute(body: any, io: any, req: any) {
    const {
      customerName,
      customerPhone,
      hallId,
      startTime,
      endTime,
      guests,
      services,
      userId,
      customerEmail,
      status,
      bookingType,
      packageName,
      selectedAddons,
      externalServices,
      subTotal,
      taxAmount,
      depositAmount,
      paymentMethod,
      paymentStatus
    } = body;

    const start = new Date(startTime);
    const end = new Date(endTime);

    // Validate Time Conflict (No Double Booking)
    const conflict = await Booking.findOne({
      where: {
        hallId,
        status: { [Op.notIn]: ['cancelled'] },
        [Op.and]: [
          { startTime: { [Op.lt]: end } },
          { endTime: { [Op.gt]: start } }
        ]
      }
    });

    if (conflict) {
      const error: any = new Error('القاعة محجوزة في هذا الوقت مسبقاً.');
      error.status = 409;
      throw error;
    }

    const isExternal = customerName === 'خارج المنصة' || body.isExternal;

    // Calculate Pricing
    let totalAmount = 0;
    let processedServices = [];
    if (!isExternal) {
      const pricing = await calculateBookingTotal(hallId, start, end, guests, services || []);
      totalAmount = pricing.totalAmount;
      processedServices = pricing.processedServices;
    }

    // Resolve user reference dynamically
    let finalUserId: number | null = userId ? Number(userId) : null;
    let finalEmail: string | null = customerEmail || null;

    if (!finalUserId || !finalEmail) {
      const condition: any = [];
      if (customerPhone) condition.push({ phone: customerPhone });
      if (customerEmail) condition.push({ email: customerEmail });

      if (condition.length > 0) {
        const matchedUser = await User.findOne({
          where: { [Op.or]: condition }
        });
        if (matchedUser) {
          if (!finalUserId) finalUserId = matchedUser.id;
          if (!finalEmail) finalEmail = matchedUser.email;
        }
      }
    }

    const booking = await this.repo.createBooking({
      customerName,
      customerPhone,
      hallId,
      startTime: start,
      endTime: end,
      guests,
      totalAmount: isExternal ? 0 : (body.amount || body.totalAmount || totalAmount),
      status: isExternal ? 'confirmed' : (status || 'pending'),
      userId: finalUserId,
      customerEmail: finalEmail,
      bookingType: bookingType || 'alacarte',
      packageName: packageName || null,
      selectedAddons: typeof selectedAddons === 'object' ? JSON.stringify(selectedAddons) : (selectedAddons || '[]'),
      externalServices: typeof externalServices === 'object' ? JSON.stringify(externalServices) : (externalServices || '[]'),
      subTotal: subTotal !== undefined ? Number(subTotal) : 0,
      taxAmount: taxAmount !== undefined ? Number(taxAmount) : 0,
      depositAmount: depositAmount !== undefined ? Number(depositAmount) : 0,
      paymentMethod: paymentMethod || null,
      paymentStatus: paymentStatus || 'pending'
    });

    for (const ps of processedServices) {
      await this.repo.createBookingService({
        bookingId: booking.id,
        serviceId: ps.service.id,
        requested_quantity: ps.quantity,
        unit_price: ps.service.price
      });
    }

    if (io) {
      io.emit("new_booking_event", booking);
    }

    if (booking.status === 'confirmed') {
      try {
        await handleReBookingForceMajeureTrigger(booking, req);
      } catch (err: any) {
        console.error('Error handling force majeure trigger on create:', err);
      }
    }

    if (booking.status === 'confirmed' || booking.status === 'completed' || booking.paymentStatus === 'مدفوع') {
      await awardLoyaltyPointsForBooking(booking);
    }

    return { message: 'تم الحجز بنجاح', booking };
  }
}
