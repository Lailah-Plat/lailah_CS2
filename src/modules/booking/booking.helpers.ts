import { Request } from 'express';
import { Op } from 'sequelize';
import { Hall, Service, Booking, BookingService, ForceMajeureRequest, HallExtraServices } from '../../models/BookingModels.js';
import { Wallet, WalletTransaction, CustomerWallet, CustomerHeldBalance, Expense } from '../../models/Database.js';
import { User, PlatformConfig } from '../../models/UserModels.js';

export function getSafeProviderName(req: Request): string {
  const headerVal = req.headers['x-user-name'];
  if (!headerVal) return '';
  try {
    return decodeURIComponent(String(headerVal));
  } catch (e) {
    return String(headerVal);
  }
}

export async function awardLoyaltyPointsForBooking(booking: any) {
  if (!booking.userId) return;
  try {
    const settingsRecord = await PlatformConfig.findOne({ where: { key: 'SYSTEM_LOYALTY_SETTINGS' } });
    let pointsPerSAR = 1;
    if (settingsRecord) {
      try {
        const settings = JSON.parse(settingsRecord.value);
        pointsPerSAR = Number(settings.pointsPerSAR) || 1;
      } catch (e) {}
    }
    const user = await User.findByPk(booking.userId);
    if (user) {
      const earnedPoints = Math.round(Number(booking.totalAmount) * pointsPerSAR);
      if (earnedPoints > 0) {
        user.points = (user.points || 0) + earnedPoints;
        await user.save();
        
        try {
          const { redisCache } = await import('../../services/redisCache.js');
          redisCache.del(`user_points:${user.id}`);
        } catch (e) {}
        console.log(`[Loyalty Engine] Awarded ${earnedPoints} points to user ${user.id} for booking ${booking.id}`);
      }
    }
  } catch (err) {
    console.error('Error in awardLoyaltyPointsForBooking:', err);
  }
}

export async function deductLoyaltyPointsForCancelledBooking(booking: any) {
  if (!booking.userId) return;
  try {
    const settingsRecord = await PlatformConfig.findOne({ where: { key: 'SYSTEM_LOYALTY_SETTINGS' } });
    let pointsPerSAR = 1;
    if (settingsRecord) {
      try {
        const settings = JSON.parse(settingsRecord.value);
        pointsPerSAR = Number(settings.pointsPerSAR) || 1;
      } catch (e) {}
    }
    const user = await User.findByPk(booking.userId);
    if (user) {
      const lostPoints = Math.round(Number(booking.totalAmount) * pointsPerSAR);
      if (lostPoints > 0) {
        user.points = Math.max(0, (user.points || 0) - lostPoints);
        await user.save();
        
        try {
          const { redisCache } = await import('../../services/redisCache.js');
          redisCache.del(`user_points:${user.id}`);
        } catch (e) {}
        console.log(`[Loyalty Engine] Deducted ${lostPoints} points from user ${user.id} due to booking ${booking.id} cancellation`);
      }
    }
  } catch (err) {
    console.error('Error in deductLoyaltyPointsForCancelledBooking:', err);
  }
}

export async function calculateBookingTotal(hallId: number, startTime: Date, endTime: Date, guests: number, services: Array<{ serviceId: number, quantity: number }>) {
  let hall = await Hall.findByPk(hallId);
  if (!hall) {
    const namesMap: Record<number, { name: string, type: string, capacity: number, rate: number }> = {
      1: { name: 'قاعة اللؤلؤة الملكية', type: 'قاعة أفراح', capacity: 500, rate: 15000 },
      2: { name: 'استراحة النخيل', type: 'استراحة قسمين', capacity: 100, rate: 2500 },
      3: { name: 'شاليهات الغروب', type: 'شاليه', capacity: 20, rate: 1200 },
      4: { name: 'قاعة امسيتي', type: 'قاعة أفراح', capacity: 400, rate: 12000 },
      5: { name: 'درة الليالي', type: 'قاعة أفراح', capacity: 800, rate: 20000 },
      6: { name: 'استراحة السعادة', type: 'استراحة قسم', capacity: 50, rate: 1500 },
      10: { name: 'قاعة الجوهرة الجديدة', type: 'قاعة أفراح', capacity: 500, rate: 18000 },
      11: { name: 'شاليهات أوشن بارك', type: 'شاليه', capacity: 15, rate: 1500 },
      12: { name: 'استراحة الواحة الهادئة', type: 'استراحة قسمين', capacity: 70, rate: 800 }
    };
    const info = namesMap[Number(hallId)] || { name: `قاعة افتراضية رقم ${hallId}`, type: 'قاعة أفراح', capacity: guests || 200, rate: 1000 };
    hall = await Hall.create({
      id: Number(hallId),
      name: info.name,
      type: info.type,
      capacity: info.capacity,
      hourlyRate: info.rate,
      status: 'active'
    });
  }

  const diffMs = endTime.getTime() - startTime.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) || 1;
  const hallBasePrice = hall.hourlyRate * days;
  
  let totalAmount = hallBasePrice;
  const processedServices = [];

  for (const sReq of services) {
    const service = await Service.findByPk(sReq.serviceId);
    if (!service || service.hallId !== Number(hallId)) continue;

    if (service.quantity !== null && sReq.quantity > service.quantity) {
      throw new Error(`الكمية المطلوبة للخدمة (${service.name}) تتجاوز المتاح (${service.quantity}).`);
    }

    const calcPrice = service.price * sReq.quantity;
    totalAmount += calcPrice;
    processedServices.push({ service, calculatedPrice: calcPrice, quantity: sReq.quantity });
  }

  return { totalAmount, processedServices, hallBasePrice, days };
}

export const formatHallResponse = (h: any) => {
  const data = h.toJSON();
  if (h.providerUser) {
    data.provider = h.providerUser.name;
  } else if (data.providerUser) {
    data.provider = data.providerUser.name;
  }
  try { data.images = typeof data.images === 'string' ? JSON.parse(data.images || '[]') : (data.images || []); } catch(e) { data.images = []; }
  try { data.features = typeof data.features === 'string' ? JSON.parse(data.features || '[]') : (data.features || []); } catch(e) { data.features = []; }
  try { data.rules = typeof data.rules === 'string' ? JSON.parse(data.rules || '[]') : (data.rules || []); } catch(e) { data.rules = []; }
  
  if (data.extraServices && Array.isArray(data.extraServices)) {
    data.extraServicesList = data.extraServices.map((es: any) => ({
      id: es.id,
      name: es.nameAr,
      nameAr: es.nameAr,
      nameEn: es.nameEn,
      desc: es.description,
      description: es.description,
      category: es.category,
      priceType: es.priceType,
      price: es.price,
      status: es.status,
      imageUrl: es.imageUrl,
      quantity: es.quantity,
      providerId: es.providerId
    }));
  } else {
    try { data.extraServicesList = typeof data.extraServicesList === 'string' ? JSON.parse(data.extraServicesList || '[]') : (data.extraServicesList || []); } catch(e) { data.extraServicesList = []; }
  }

  try { data.paymentMethods = typeof data.paymentMethod === 'string' ? JSON.parse(data.paymentMethod || '[]') : (data.paymentMethods || []); } catch(e) { data.paymentMethods = []; }
  try { data.packagesList = typeof data.packagesList === 'string' ? JSON.parse(data.packagesList || '[]') : (data.packagesList || []); } catch(e) { data.packagesList = []; }
  return data;
};

export const syncHallExtraServicesTable = async (hallId: number, servicesList: any[], providerId: number | null) => {
  if (!Array.isArray(servicesList)) return;
  await HallExtraServices.destroy({ where: { hallId } });
  for (const s of servicesList) {
    await HallExtraServices.create({
      hallId,
      providerId,
      nameAr: s.nameAr || s.name || 'خدمة إضافية',
      nameEn: s.nameEn || s.name_en || null,
      description: s.description || s.desc || null,
      category: s.category || null,
      priceType: s.priceType || 'flat_fee',
      price: Number(s.price) || 0,
      status: s.status || 'active',
      imageUrl: s.imageUrl || s.image_url || null,
      quantity: s.quantity ? Number(s.quantity) : null
    });
  }
};

export async function handleReBookingForceMajeureTrigger(booking: any, req: any) {
  if (booking.status !== 'confirmed') return;

  try {
    const approvedFMRequests = await ForceMajeureRequest.findAll({
      where: { status: 'approved' }
    });

    for (const fm of approvedFMRequests) {
      const origBooking = await Booking.findByPk(fm.bookingId);
      if (origBooking && origBooking.hallId === booking.hallId) {
        const origStart = new Date(origBooking.startTime).getTime();
        const origEnd = new Date(origBooking.endTime).getTime();
        const currStart = new Date(booking.startTime).getTime();
        const currEnd = new Date(booking.endTime).getTime();

        const startOverlap = origStart < currEnd;
        const endOverlap = origEnd > currStart;

        if (startOverlap && endOverlap) {
          const heldBalance = await CustomerHeldBalance.findOne({
            where: {
              originalBookingId: fm.bookingId,
              holdReason: 'force_majeure',
              conversionStatus: 'held'
            }
          });

          if (heldBalance) {
            const refundAmount = heldBalance.amount;
            const finalEmail = fm.customerEmail;

            const [cWallet] = await CustomerWallet.findOrCreate({
              where: { customerEmail: finalEmail },
              defaults: { customerName: fm.customerName, cashBalance: 0 }
            });

            await heldBalance.update({
              conversionStatus: 'converted_to_cash',
              notes: `تم تحويل الرصيد الدفتري للقوة القاهرة تلقائياً إلى نقد بالكامل 100% لإعادة حجز القاعة وملاءمة الحجز الجديد رقم #${booking.id}`
            });

            await cWallet.update({
              cashBalance: cWallet.cashBalance + refundAmount
            });

            const providerId = heldBalance.originalProviderId ? Number(heldBalance.originalProviderId) : 1;
            const [pWallet] = await Wallet.findOrCreate({
              where: { providerId },
              defaults: { balance: 0, pendingBalance: 0 }
            });

            await pWallet.update({
              balance: Math.max(0, pWallet.balance - refundAmount)
            });

            await WalletTransaction.create({
              providerId,
              type: 'refund',
              description: `استرداد نقدي تلقائي لحساب حجز القوة القاهرة رقم #${fm.bookingId} لإعادة بيع القاعة بموجب حجز رقم #${booking.id}`,
              amount: refundAmount,
              status: 'completed'
            });

            await Expense.create({
              title: `استرداد نقدي تلقائي لمناسب القوة القاهرة #${fm.bookingId} بموجب حجز جديد رقم #${booking.id}`,
              amount: refundAmount / 1.15,
              vatAmount: refundAmount - (refundAmount / 1.15),
              amountIncludingVat: refundAmount,
              category: String(providerId),
              paymentMethod: 'refund_rebook',
              status: 'paid',
              EmployeeId: 1,
              type: 'refund'
            });

            await fm.update({
              adminNotes: `${fm.adminNotes || ''}\n[تلقائي] تم تحويل الرصيد الائتماني الدفتري إلى استرداد نقدي 100% بعد إعادة حجز القاعة للعميل الآخر رقم #${booking.id}.`,
              refundType: 'cash',
              amountRefunded: refundAmount
            });

            console.log(`[ReBooking Cash Refund] Successfully converted force majeure credit of FM #${fm.id} to cash refund due to overlap with new booking #${booking.id}.`);
          }
        }
      }
    }
  } catch (err: any) {
    console.error('Error inside handleReBookingForceMajeureTrigger:', err);
  }
}
