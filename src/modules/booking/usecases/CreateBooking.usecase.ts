/**
 * @file CreateBooking.usecase.ts
 * @description P2.2 - Period-Based Booking Creation with Strict Double-Booking & Hold Validation
 */

import { Op, Transaction } from 'sequelize';
import { BookingRepository } from '../booking.repository.js';
import {
  calculateBookingTotal,
  awardLoyaltyPointsForBooking,
  handleReBookingForceMajeureTrigger
} from '../booking.helpers.js';
import { Booking, Hall, ExternalBlockedDate } from '../../../models/BookingModels.js';
import { User } from '../../../models/UserModels.js';
import { sequelize } from '../../../models/dbInstance.js';
import { bookingPolicyService } from '../../../services/bookingPolicy/bookingPolicyService.js';
import { PeriodConflictService } from '../../../services/bookingPolicy/periodConflictService.js';
import { BookingHoldService } from '../../../services/bookingPolicy/bookingHoldService.js';
import { regulatoryPeriodService } from '../../../services/bookingPolicy/regulatoryPeriodService.js';
import { BookingStateMachine } from '../../../services/lifecycle/BookingStateMachine.js';
import { LifecycleAuditService } from '../../../services/lifecycle/LifecycleAuditService.js';

export class CreateBookingUseCase {
  constructor(private repo: BookingRepository) {}

  async execute(body: any, io: any, req: any) {
    const {
      customerName,
      customerPhone,
      hallId,
      startTime,
      endTime,
      bookingDate,
      bookingPeriod,
      period,
      holdToken,
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
      paymentStatus,
      bookingPaymentPolicy,
      explicitPolicy
    } = body;

    const hallIdNum = Number(hallId);
    if (!hallIdNum) {
      const error: any = new Error('معرّف القاعة مطلوب');
      error.status = 400;
      throw error;
    }

    // Determine normalized date and period (P2.2)
    const rawDate = bookingDate || startTime || new Date().toISOString();
    const dateStr = PeriodConflictService.normalizeDate(rawDate);
    const resolvedPeriod = PeriodConflictService.normalizePeriod(bookingPeriod || period || 'FULL_DAY');

    const start = startTime ? new Date(startTime) : new Date(`${dateStr}T00:00:00.000Z`);
    const end = endTime ? new Date(endTime) : new Date(`${dateStr}T23:59:59.999Z`);

    const isExternal = customerName === 'خارج المنصة' || body.isExternal;

    // Resolve Hall and Provider ID for Policy Resolution (P1.9)
    let hallProviderId: number | null = null;
    let hallObj: any = null;
    if (hallIdNum) {
      hallObj = await Hall.findByPk(hallIdNum);
      if (hallObj) {
        hallProviderId = hallObj.providerId || null;
      }
    }

    // Resolve Effective Booking & Payment Policy (P1.9)
    const resolvedPolicyData = await bookingPolicyService.resolveEffectiveBookingPolicy({
      providerId: hallProviderId || Number(body.providerId) || 0,
      hallId: hallIdNum ? Number(hallIdNum) : null,
      explicitPolicy: explicitPolicy || bookingPaymentPolicy || null
    });

    const activePolicy = resolvedPolicyData.policy;
    const policySnapshotStr = JSON.stringify(resolvedPolicyData.snapshot);

    // P2.3-P2.4 - Snapshot Regulatory Timing for Period
    const periodSnapshotObj = await regulatoryPeriodService.createPeriodSnapshot(resolvedPeriod, dateStr);
    const periodSnapshotStr = JSON.stringify(periodSnapshotObj);

    // Calculate Pricing
    let totalAmount = 0;
    let processedServices = [];
    if (!isExternal) {
      const pricing = await calculateBookingTotal(hallIdNum, start, end, guests, services || []);
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

    const deadlineHours = resolvedPolicyData.snapshot.providerResponseDeadlineHours;
    const providerResponseDeadline = (deadlineHours && deadlineHours > 0)
      ? new Date(Date.now() + deadlineHours * 60 * 60 * 1000)
      : null;

    // Compute the 8 orthogonal state axes based on resolved policy & payment status
    const initialAxes = BookingStateMachine.computeInitialAxes({
      policy: activePolicy,
      isExternal,
      hasPrePaid: paymentStatus === 'مدفوع' || paymentStatus === 'PAID' || Boolean(paymentMethod),
      hasAuthorized: paymentStatus === 'AUTHORIZED' || paymentStatus === 'مفوض'
    });

    let finalStatus = status || initialAxes.legacyStatus;
    let finalPaymentStatus = paymentStatus || initialAxes.legacyPaymentStatus;

    if (isExternal) {
      finalStatus = 'confirmed';
      finalPaymentStatus = 'مدفوع';
    } else if (activePolicy === 'INSTANT_CONFIRMATION' && (paymentStatus === 'مدفوع' || paymentMethod)) {
      finalStatus = 'confirmed';
      finalPaymentStatus = 'مدفوع';
    }

    const preApprovalSnapshot = JSON.stringify({
      grossAmount: isExternal ? 0 : (body.amount || body.totalAmount || totalAmount),
      subTotal: subTotal !== undefined ? Number(subTotal) : 0,
      taxAmount: taxAmount !== undefined ? Number(taxAmount) : 0,
      bookingType: bookingType || 'alacarte',
      packageName: packageName || null,
      selectedAddons: selectedAddons || [],
      externalServices: externalServices || [],
      bookingPaymentPolicy: activePolicy,
      bookingDate: dateStr,
      bookingPeriod: resolvedPeriod,
      createdAt: new Date().toISOString()
    });

    // P2.2 Strict Transaction & Atomic Period Conflict Verification
    const conflictingPeriods = PeriodConflictService.getConflictingPeriods(resolvedPeriod);

    const booking = await sequelize.transaction(async (t: Transaction) => {
      // 1. Verify against active existing bookings
      const existingConflict = await Booking.findOne({
        where: {
          hallId: hallIdNum,
          bookingDate: dateStr,
          bookingPeriod: {
            [Op.in]: conflictingPeriods
          },
          status: {
            [Op.notIn]: ['cancelled', 'rejected', 'expired', 'ملغى', 'مرفوض', 'منتهي', 'CANCELLED', 'REJECTED', 'EXPIRED']
          },
          lifecycleStatus: {
            [Op.notIn]: ['CANCELLED', 'REJECTED', 'EXPIRED', 'FULFILLED', 'TERMINATED']
          }
        },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (existingConflict) {
        const error: any = new Error(`القاعة محجوزة مسبقاً في نفس الفترة أو فترة متعارضة (${PeriodConflictService.toArabicPeriod(resolvedPeriod)}).`);
        error.status = 409;
        throw error;
      }

      // 2. Verify against external/manual blocks
      const existingBlock = await ExternalBlockedDate.findOne({
        where: {
          entityId: hallIdNum,
          entityType: 'hall',
          status: 'active',
          startDate: { [Op.lte]: dateStr },
          endDate: { [Op.gte]: dateStr }
        },
        transaction: t
      });

      if (existingBlock) {
        const blkPeriod = PeriodConflictService.normalizePeriod(existingBlock.period);
        if (PeriodConflictService.doPeriodsConflict(resolvedPeriod, blkPeriod)) {
          const error: any = new Error(`القاعة مغلقة أو معطلة في هذا التاريخ (${existingBlock.reason || 'حظر إداري'}).`);
          error.status = 409;
          throw error;
        }
      }

      // 3. If holdToken provided, verify and convert it
      if (holdToken) {
        await BookingHoldService.convertHold(holdToken, t);
      }

      // 4. Create the booking record atomically
      const newBooking = await Booking.create({
        customerName,
        customerPhone,
        hallId: hallIdNum,
        startTime: start,
        endTime: end,
        bookingDate: dateStr,
        bookingPeriod: resolvedPeriod,
        holdToken: holdToken || null,
        guests,
        totalAmount: isExternal ? 0 : (body.amount || body.totalAmount || totalAmount),
        status: finalStatus,
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
        paymentStatus: finalPaymentStatus,
        // 8 Orthogonal State Axes
        lifecycleStatus: initialAxes.lifecycleStatus,
        providerDecision: initialAxes.providerDecision,
        paymentState: initialAxes.paymentState,
        refundState: initialAxes.refundState,
        disputeState: initialAxes.disputeState,
        fulfillmentState: initialAxes.fulfillmentState,
        entitlementState: initialAxes.entitlementState,
        settlementState: initialAxes.settlementState,
        providerResponseDeadline: isExternal ? null : providerResponseDeadline,
        preApprovalSnapshot,
        bookingPaymentPolicy: activePolicy,
        bookingPaymentPolicySnapshot: policySnapshotStr,
        periodSnapshot: periodSnapshotStr
      }, { transaction: t });

      return newBooking;
    });

    // Record creation audit log and domain event
    await LifecycleAuditService.recordTransition({
      aggregateType: 'Booking',
      aggregateId: booking.id,
      fromState: 'NONE',
      toState: initialAxes.lifecycleStatus,
      action: 'INITIALIZE',
      actorId: finalUserId,
      actorRole: isExternal ? 'provider' : 'customer',
      metadata: {
        policy: activePolicy,
        bookingNumber: booking.bookingNumber,
        totalAmount: booking.totalAmount,
        bookingDate: dateStr,
        bookingPeriod: resolvedPeriod
      }
    });

    await LifecycleAuditService.publishDomainEvent({
      eventType: 'BOOKING_CREATED',
      aggregateType: 'Booking',
      aggregateId: booking.id,
      actorId: finalUserId,
      actorRole: isExternal ? 'provider' : 'customer',
      payload: {
        bookingNumber: booking.bookingNumber,
        hallId: hallIdNum,
        policy: activePolicy,
        totalAmount: booking.totalAmount,
        bookingDate: dateStr,
        bookingPeriod: resolvedPeriod
      },
      stateSnapshot: initialAxes
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
