/**
 * @file GetAvailability.usecase.ts
 * @description P2.2 - Unified Period-Based Availability Resolution
 * Returns the exact status of MORNING, EVENING, and FULL_DAY for a hall on a specific date.
 */

import { Op } from 'sequelize';
import { BookingRepository } from '../booking.repository.js';
import { Booking, BookingHold, ExternalBlockedDate } from '../../../models/BookingModels.js';
import { PeriodConflictService } from '../../../services/bookingPolicy/periodConflictService.js';
import { BookingHoldService } from '../../../services/bookingPolicy/bookingHoldService.js';
import { BookingPeriod } from '../../../types/index.js';

export class GetAvailabilityUseCase {
  constructor(private repo: BookingRepository) {}

  async execute(hallIdInput: any, dateInput: any) {
    const hallId = Number(hallIdInput);
    if (!hallId || !dateInput) {
      const error: any = new Error('hallId and date are required');
      error.status = 400;
      throw error;
    }

    const dateStr = PeriodConflictService.normalizeDate(dateInput);

    // 1. Clean up expired holds for this hall & date
    await BookingHoldService.cleanupExpiredHolds(hallId, dateStr);

    // 2. Fetch active bookings on this date (excluding cancelled/rejected)
    const bookings = await Booking.findAll({
      where: {
        hallId,
        [Op.or]: [
          { bookingDate: dateStr },
          {
            startTime: {
              [Op.between]: [
                new Date(`${dateStr}T00:00:00.000Z`),
                new Date(`${dateStr}T23:59:59.999Z`)
              ]
            }
          }
        ],
        status: {
          [Op.notIn]: ['CANCELLED', 'REJECTED', 'EXPIRED', 'FAILED', 'cancelled']
        },
        lifecycleStatus: {
          [Op.notIn]: ['CANCELLED', 'REJECTED', 'EXPIRED', 'FULFILLED', 'TERMINATED']
        }
      },
      attributes: ['id', 'bookingNumber', 'bookingPeriod', 'status', 'lifecycleStatus', 'customerName']
    });

    // 3. Fetch active holds
    const activeHolds = await BookingHold.findAll({
      where: {
        hallId,
        bookingDate: dateStr,
        status: 'ACTIVE',
        expiresAt: { [Op.gt]: new Date() }
      },
      attributes: ['id', 'holdToken', 'period', 'expiresAt', 'policy']
    });

    // 4. Fetch active external/manual blocks
    const activeBlocks = await ExternalBlockedDate.findAll({
      where: {
        entityId: hallId,
        entityType: 'hall',
        status: 'active',
        startDate: { [Op.lte]: dateStr },
        endDate: { [Op.gte]: dateStr }
      },
      attributes: ['id', 'blockId', 'period', 'reason', 'blockType']
    });

    // 5. Evaluate Period Matrix for MORNING, EVENING, FULL_DAY
    const periods: Record<BookingPeriod, any> = {
      MORNING: { isAvailable: true, status: 'AVAILABLE', bookingId: null, holdToken: null, reason: null },
      EVENING: { isAvailable: true, status: 'AVAILABLE', bookingId: null, holdToken: null, reason: null },
      FULL_DAY: { isAvailable: true, status: 'AVAILABLE', bookingId: null, holdToken: null, reason: null }
    };

    // Check Bookings
    for (const bkg of bookings) {
      const bkgPeriod = PeriodConflictService.normalizePeriod(bkg.bookingPeriod || 'FULL_DAY');
      if (bkgPeriod === 'FULL_DAY') {
        periods.MORNING = { isAvailable: false, status: 'BOOKED', bookingId: bkg.id, reason: 'محجوز بالكامل' };
        periods.EVENING = { isAvailable: false, status: 'BOOKED', bookingId: bkg.id, reason: 'محجوز بالكامل' };
        periods.FULL_DAY = { isAvailable: false, status: 'BOOKED', bookingId: bkg.id, reason: 'محجوز بالكامل' };
      } else if (bkgPeriod === 'MORNING') {
        periods.MORNING = { isAvailable: false, status: 'BOOKED', bookingId: bkg.id, reason: 'الفترة الصباحية محجوزة' };
        periods.FULL_DAY = { isAvailable: false, status: 'BOOKED', bookingId: bkg.id, reason: 'تعارض مع حجز الفترة الصباحية' };
      } else if (bkgPeriod === 'EVENING') {
        periods.EVENING = { isAvailable: false, status: 'BOOKED', bookingId: bkg.id, reason: 'الفترة المسائية محجوزة' };
        periods.FULL_DAY = { isAvailable: false, status: 'BOOKED', bookingId: bkg.id, reason: 'تعارض مع حجز الفترة المسائية' };
      }
    }

    // Check Holds (if not already booked)
    for (const hold of activeHolds) {
      const holdPeriod = PeriodConflictService.normalizePeriod(hold.period);
      if (holdPeriod === 'FULL_DAY') {
        if (periods.MORNING.isAvailable) periods.MORNING = { isAvailable: false, status: 'HELD', holdToken: hold.holdToken, expiresAt: hold.expiresAt, reason: 'حجز مؤقت جاري' };
        if (periods.EVENING.isAvailable) periods.EVENING = { isAvailable: false, status: 'HELD', holdToken: hold.holdToken, expiresAt: hold.expiresAt, reason: 'حجز مؤقت جاري' };
        if (periods.FULL_DAY.isAvailable) periods.FULL_DAY = { isAvailable: false, status: 'HELD', holdToken: hold.holdToken, expiresAt: hold.expiresAt, reason: 'حجز مؤقت جاري' };
      } else if (holdPeriod === 'MORNING') {
        if (periods.MORNING.isAvailable) periods.MORNING = { isAvailable: false, status: 'HELD', holdToken: hold.holdToken, expiresAt: hold.expiresAt, reason: 'حجز مؤقت جاري للصباحية' };
        if (periods.FULL_DAY.isAvailable) periods.FULL_DAY = { isAvailable: false, status: 'HELD', holdToken: hold.holdToken, expiresAt: hold.expiresAt, reason: 'تعارض مع حجز مؤقت صباحي' };
      } else if (holdPeriod === 'EVENING') {
        if (periods.EVENING.isAvailable) periods.EVENING = { isAvailable: false, status: 'HELD', holdToken: hold.holdToken, expiresAt: hold.expiresAt, reason: 'حجز مؤقت جاري للمسائية' };
        if (periods.FULL_DAY.isAvailable) periods.FULL_DAY = { isAvailable: false, status: 'HELD', holdToken: hold.holdToken, expiresAt: hold.expiresAt, reason: 'تعارض مع حجز مؤقت مسائي' };
      }
    }

    // Check External / Manual Blocks
    for (const block of activeBlocks) {
      const blockPeriod = PeriodConflictService.normalizePeriod(block.period);
      const reason = block.reason || 'مغلق للصيانة أو محظور من المزود';
      if (blockPeriod === 'FULL_DAY') {
        periods.MORNING = { isAvailable: false, status: 'BLOCKED', reason };
        periods.EVENING = { isAvailable: false, status: 'BLOCKED', reason };
        periods.FULL_DAY = { isAvailable: false, status: 'BLOCKED', reason };
      } else if (blockPeriod === 'MORNING') {
        periods.MORNING = { isAvailable: false, status: 'BLOCKED', reason };
        periods.FULL_DAY = { isAvailable: false, status: 'BLOCKED', reason: 'تعارض مع إغلاق الفترة الصباحية' };
      } else if (blockPeriod === 'EVENING') {
        periods.EVENING = { isAvailable: false, status: 'BLOCKED', reason };
        periods.FULL_DAY = { isAvailable: false, status: 'BLOCKED', reason: 'تعارض مع إغلاق الفترة المسائية' };
      }
    }

    return {
      date: dateStr,
      hallId,
      periods,
      // Backward compatibility fields for legacy UI callers
      bookings: bookings.map(b => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        period: b.bookingPeriod || 'FULL_DAY',
        status: b.status
      })),
      activeHoldsCount: activeHolds.length,
      activeBlocksCount: activeBlocks.length
    };
  }
}
