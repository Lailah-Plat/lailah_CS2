/**
 * @file booking_p2_2_availability_and_hold_integrity.test.ts
 * @description P2.2 — Comprehensive Test Suite for Period Availability, Conflict Matrix, Holds & Concurrency Protection
 */

import { PeriodConflictService } from '../services/bookingPolicy/periodConflictService.js';
import { BookingHoldService } from '../services/bookingPolicy/bookingHoldService.js';
import { syncBookingModels, Booking, BookingHold, ExternalBlockedDate, Hall } from '../models/BookingModels.js';
import { sequelize } from '../models/dbInstance.js';
import { BookingRepository } from '../modules/booking/booking.repository.js';
import { GetAvailabilityUseCase } from '../modules/booking/usecases/GetAvailability.usecase.js';
import { CreateBookingUseCase } from '../modules/booking/usecases/CreateBooking.usecase.js';

export async function runP22TestSuite() {
  console.log('🚀 =================================================================');
  console.log('🚀 Starting P2.2 Availability, Hold & Double-Booking Integrity Tests');
  console.log('🚀 =================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 0. Ensure schema is synchronized
    await syncBookingModels();

    // Use Hall 1 for test suite
    const hallId = 1;
    const testDate = '2026-11-20';

    // Clean any previous test data on test date
    await Booking.destroy({ where: { hallId, bookingDate: [testDate, '2026-11-21', '2026-11-22'] } });
    await BookingHold.destroy({ where: { hallId, bookingDate: [testDate, '2026-11-21', '2026-11-22'] } });
    await ExternalBlockedDate.destroy({ where: { entityId: hallId, startDate: [testDate, '2026-11-21', '2026-11-22'] } });

    // =========================================================================
    // Group 1: Conflict Matrix & Period Normalization Tests (10 tests)
    // =========================================================================
    console.log('\n--- Group 1: Conflict Matrix & Period Normalization ---');

    assert(
      PeriodConflictService.normalizePeriod('صباحية') === 'MORNING',
      '1.1 Normalizes Arabic "صباحية" to MORNING'
    );
    assert(
      PeriodConflictService.normalizePeriod('مسائية') === 'EVENING',
      '1.2 Normalizes Arabic "مسائية" to EVENING'
    );
    assert(
      PeriodConflictService.normalizePeriod('يوم كامل') === 'FULL_DAY',
      '1.3 Normalizes Arabic "يوم كامل" to FULL_DAY'
    );
    assert(
      PeriodConflictService.normalizePeriod('كاملة') === 'FULL_DAY',
      '1.4 Normalizes Arabic "كاملة" to FULL_DAY'
    );

    assert(
      PeriodConflictService.doPeriodsConflict('MORNING', 'MORNING') === true,
      '1.5 MORNING vs MORNING -> CONFLICT'
    );
    assert(
      PeriodConflictService.doPeriodsConflict('MORNING', 'EVENING') === false,
      '1.6 MORNING vs EVENING -> NO CONFLICT (Independent operational periods)'
    );
    assert(
      PeriodConflictService.doPeriodsConflict('MORNING', 'FULL_DAY') === true,
      '1.7 MORNING vs FULL_DAY -> CONFLICT'
    );
    assert(
      PeriodConflictService.doPeriodsConflict('EVENING', 'FULL_DAY') === true,
      '1.8 EVENING vs FULL_DAY -> CONFLICT'
    );
    assert(
      PeriodConflictService.doPeriodsConflict('FULL_DAY', 'MORNING') === true,
      '1.9 FULL_DAY vs MORNING -> CONFLICT'
    );
    assert(
      PeriodConflictService.doPeriodsConflict('FULL_DAY', 'EVENING') === true,
      '1.10 FULL_DAY vs EVENING -> CONFLICT'
    );

    // =========================================================================
    // Group 2: Atomic Holds & Expiration Tests (7 tests)
    // =========================================================================
    console.log('\n--- Group 2: Atomic Holds & Expiration Lifecycle ---');

    // 2.1 Acquire hold for Morning
    const hold1 = await BookingHoldService.acquireHold({
      hallId,
      date: testDate,
      period: 'MORNING',
      userId: 1,
      sessionId: 'sess-101'
    });

    assert(
      hold1.success === true && Boolean(hold1.holdToken),
      '2.1 Successfully acquired temporary hold for MORNING'
    );

    // 2.2 Attempt conflicting hold for MORNING (should fail with 409 conflict)
    const hold2 = await BookingHoldService.acquireHold({
      hallId,
      date: testDate,
      period: 'MORNING',
      userId: 2,
      sessionId: 'sess-102'
    });

    assert(
      hold2.success === false && hold2.errorCode === 'PERIOD_HOLD_ACTIVE',
      '2.2 Conflicting hold attempt for active MORNING period is blocked (409)'
    );

    // 2.3 Attempt conflicting hold for FULL_DAY (should fail because MORNING is held)
    const hold3 = await BookingHoldService.acquireHold({
      hallId,
      date: testDate,
      period: 'FULL_DAY',
      userId: 3,
      sessionId: 'sess-103'
    });

    assert(
      hold3.success === false,
      '2.3 Conflicting hold attempt for FULL_DAY while MORNING is held is blocked'
    );

    // 2.4 Hold for EVENING on same date (should succeed)
    const hold4 = await BookingHoldService.acquireHold({
      hallId,
      date: testDate,
      period: 'EVENING',
      userId: 4,
      sessionId: 'sess-104'
    });

    assert(
      hold4.success === true,
      '2.4 Concurrent hold for EVENING succeeds while MORNING is held'
    );

    // 2.5 Verify Hold status
    const verify1 = await BookingHoldService.verifyHold(hold1.holdToken!, hallId, testDate, 'MORNING');
    assert(
      verify1.isValid === true,
      '2.5 Verification of valid active hold returns isValid: true'
    );

    // 2.6 Release Hold
    const released = await BookingHoldService.releaseHold(hold1.holdToken!);
    assert(
      released === true,
      '2.6 Successfully released temporary hold'
    );

    // 2.7 Acquire Hold after release
    const hold5 = await BookingHoldService.acquireHold({
      hallId,
      date: testDate,
      period: 'MORNING',
      userId: 5,
      sessionId: 'sess-105'
    });
    assert(
      hold5.success === true,
      '2.7 MORNING period is immediately re-acquirable after hold release'
    );

    // Clean holds for next group
    await BookingHold.destroy({ where: { hallId } });

    // =========================================================================
    // Group 3: Period-Based Availability UseCase (5 tests)
    // =========================================================================
    console.log('\n--- Group 3: Period Availability UseCase Output ---');

    const repo = new BookingRepository();
    const getAvailabilityUseCase = new GetAvailabilityUseCase(repo);

    // 3.1 Availability on clean date
    const availClean = await getAvailabilityUseCase.execute(hallId, testDate);
    assert(
      availClean.periods.MORNING.isAvailable === true &&
      availClean.periods.EVENING.isAvailable === true &&
      availClean.periods.FULL_DAY.isAvailable === true,
      '3.1 All periods (MORNING, EVENING, FULL_DAY) are available on clean date'
    );

    // 3.2 Block morning with an active hold
    const activeHold = await BookingHoldService.acquireHold({
      hallId,
      date: testDate,
      period: 'MORNING',
      userId: 1
    });

    const availWithHold = await getAvailabilityUseCase.execute(hallId, testDate);
    assert(
      availWithHold.periods.MORNING.isAvailable === false &&
      availWithHold.periods.MORNING.status === 'HELD' &&
      availWithHold.periods.EVENING.isAvailable === true &&
      availWithHold.periods.FULL_DAY.isAvailable === false,
      '3.2 Holding MORNING makes morning & fullDay unavailable, leaves evening available'
    );

    // Release hold
    await BookingHoldService.releaseHold(activeHold.holdToken!);

    // 3.3 Create confirmed booking for EVENING
    const createBookingUseCase = new CreateBookingUseCase(repo);
    const createdBooking = await createBookingUseCase.execute({
      customerName: 'فهد العتيبي',
      customerPhone: '0501234567',
      hallId,
      bookingDate: testDate,
      bookingPeriod: 'مسائية',
      status: 'confirmed',
      paymentStatus: 'مدفوع'
    }, null, { headers: {} });

    assert(
      Boolean(createdBooking.booking && createdBooking.booking.id),
      '3.3 Successfully created confirmed booking for EVENING period'
    );

    const availWithBooking = await getAvailabilityUseCase.execute(hallId, testDate);
    assert(
      availWithBooking.periods.EVENING.isAvailable === false &&
      availWithBooking.periods.MORNING.isAvailable === true &&
      availWithBooking.periods.FULL_DAY.isAvailable === false,
      '3.4 Booked EVENING makes evening & fullDay unavailable, leaves morning available'
    );

    // 3.5 External Blocked Date Test
    const nextDate = '2026-11-21';
    await ExternalBlockedDate.create({
      blockId: 'BLK-26-0000000001',
      entityId: hallId,
      entityType: 'hall',
      entityName: 'قاعة الاختبارات',
      startDate: nextDate,
      endDate: nextDate,
      period: 'يوم كامل',
      blockType: 'maintenance',
      reason: 'أعمال صيانة دورية',
      status: 'active'
    });

    const availBlocked = await getAvailabilityUseCase.execute(hallId, nextDate);
    assert(
      availBlocked.periods.MORNING.isAvailable === false &&
      availBlocked.periods.EVENING.isAvailable === false &&
      availBlocked.periods.FULL_DAY.isAvailable === false,
      '3.5 External/Manual Block on FULL_DAY makes all periods unavailable'
    );

    // =========================================================================
    // Group 4: Double-Booking Prevention & Concurrency in CreateBooking (5 tests)
    // =========================================================================
    console.log('\n--- Group 4: Double-Booking & Conflict Guard in CreateBooking ---');

    // 4.1 Attempt booking conflicting with existing EVENING booking (on testDate)
    let doubleBookingBlocked = false;
    try {
      await createBookingUseCase.execute({
        customerName: 'سلطان الدوسري',
        customerPhone: '0509876543',
        hallId,
        bookingDate: testDate,
        bookingPeriod: 'مسائية'
      }, null, { headers: {} });
    } catch (err: any) {
      if (err.status === 409) {
        doubleBookingBlocked = true;
      }
    }
    assert(
      doubleBookingBlocked === true,
      '4.1 Creating conflicting booking on already booked EVENING throws 409 Conflict'
    );

    // 4.2 Attempt booking FULL_DAY when EVENING is booked (should fail with 409)
    let fullDayBlocked = false;
    try {
      await createBookingUseCase.execute({
        customerName: 'ماجد الشمري',
        customerPhone: '0555555555',
        hallId,
        bookingDate: testDate,
        bookingPeriod: 'كاملة'
      }, null, { headers: {} });
    } catch (err: any) {
      if (err.status === 409) {
        fullDayBlocked = true;
      }
    }
    assert(
      fullDayBlocked === true,
      '4.2 Creating FULL_DAY booking when EVENING is booked throws 409 Conflict'
    );

    // 4.3 Booking MORNING on same date (should succeed)
    const morningBooking = await createBookingUseCase.execute({
      customerName: 'تركي المطيري',
      customerPhone: '0544444444',
      hallId,
      bookingDate: testDate,
      bookingPeriod: 'صباحية'
    }, null, { headers: {} });

    assert(
      Boolean(morningBooking.booking && morningBooking.booking.id),
      '4.3 Booking independent MORNING period on same date succeeds'
    );

    // 4.4 Attempt booking on blocked date
    let blockedDateBookingRejected = false;
    try {
      await createBookingUseCase.execute({
        customerName: 'خالد القحطاني',
        customerPhone: '0533333333',
        hallId,
        bookingDate: nextDate,
        bookingPeriod: 'صباحية'
      }, null, { headers: {} });
    } catch (err: any) {
      if (err.status === 409) {
        blockedDateBookingRejected = true;
      }
    }
    assert(
      blockedDateBookingRejected === true,
      '4.4 Booking on externally/manually blocked date is rejected with 409'
    );

    // 4.5 Hold Conversion on booking
    const holdDate = '2026-11-22';
    const preHold = await BookingHoldService.acquireHold({
      hallId,
      date: holdDate,
      period: 'FULL_DAY',
      userId: 88
    });

    const bookedWithHold = await createBookingUseCase.execute({
      customerName: 'نواف العنزي',
      customerPhone: '0522222222',
      hallId,
      bookingDate: holdDate,
      bookingPeriod: 'يوم كامل',
      holdToken: preHold.holdToken
    }, null, { headers: {} });

    const convertedHold = await BookingHold.findOne({ where: { holdToken: preHold.holdToken } });
    assert(
      bookedWithHold.booking && (convertedHold?.status === 'CONVERTED' || convertedHold?.status === 'converted'),
      '4.5 Booking creation with holdToken converts hold status to "CONVERTED"'
    );

    // Cleanup test data
    await Booking.destroy({ where: { hallId, bookingDate: [testDate, nextDate, holdDate] } });
    await BookingHold.destroy({ where: { hallId, bookingDate: [testDate, nextDate, holdDate] } });
    await ExternalBlockedDate.destroy({ where: { entityId: hallId, startDate: [testDate, nextDate, holdDate] } });

  } catch (globalErr: any) {
    console.error('💥 Test suite encountered fatal error:', globalErr);
    failed++;
  }

  console.log('\n=================================================================');
  console.log(`📊 P2.2 Test Results: ${passed} Passed, ${failed} Failed (Total: ${passed + failed})`);
  console.log('=================================================================\n');

  return { passed, failed, total: passed + failed };
}

// Auto-run if executed directly
runP22TestSuite().then(res => {
  if (res.failed > 0) {
    process.exit(1);
  }
}).catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
