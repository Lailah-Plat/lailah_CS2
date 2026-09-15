/**
 * @file bookingHoldService.ts
 * @description P2.2 - Atomic Booking Hold & Lock Service
 * Handles Hold TTL generation, atomic transactions, conflict validation, hold release, and expiration cleanup.
 */

import { Op, Transaction } from 'sequelize';
import crypto from 'crypto';
import { sequelize } from '../../models/dbInstance.js';
import { BookingHold, Booking, ExternalBlockedDate, Hall } from '../../models/BookingModels.js';
import { bookingPolicyService } from './bookingPolicyService.js';
import { PeriodConflictService } from './periodConflictService.js';
import { BookingPeriod, BookingPaymentPolicy } from '../../types/index.js';

export interface CreateHoldParams {
  hallId: number;
  date: string; // YYYY-MM-DD
  period: BookingPeriod | string;
  userId?: number | null;
  sessionId?: string | null;
}

export interface HoldResult {
  success: boolean;
  hold?: any;
  holdToken?: string;
  expiresAt?: Date;
  ttlSeconds?: number;
  policy?: BookingPaymentPolicy;
  error?: string;
  errorCode?: 'PERIOD_UNAVAILABLE' | 'HALL_NOT_FOUND' | 'HOLD_CREATION_FAILED' | 'INVALID_PARAMS' | 'PERIOD_HOLD_ACTIVE';
}

export interface VerificationResult {
  isValid: boolean;
  hold?: any;
  reason?: string;
}

export class BookingHoldService {
  /**
   * TTL Configurations (in seconds) based on Platform Booking Policy
   * - INSTANT_CONFIRMATION: 15 minutes checkout lock
   * - APPROVAL_BEFORE_PAYMENT: 24h provider decision hold, 6h post-approval payment lock
   */
  public static readonly TTL_INSTANT_CONFIRMATION_SECONDS = 15 * 60; // 900s (15m)
  public static readonly TTL_APPROVAL_DECISION_SECONDS = 24 * 60 * 60; // 86400s (24h)
  public static readonly TTL_APPROVAL_PAYMENT_SECONDS = 6 * 60 * 60; // 21600s (6h)

  /**
   * Acquire an atomic hold for a hall on a specific date and period.
   * Uses a managed database transaction to guarantee no race conditions or double holds.
   */
  public static async acquireHold(params: CreateHoldParams): Promise<HoldResult> {
    const hallId = Number(params.hallId);
    const dateStr = PeriodConflictService.normalizeDate(params.date);
    const period = PeriodConflictService.normalizePeriod(params.period);

    if (!hallId || !dateStr) {
      return {
        success: false,
        error: 'معرّف القاعة والتاريخ مطلوبان لإنشاء الحماية المؤقتة',
        errorCode: 'INVALID_PARAMS'
      };
    }

    // Resolve Hall and Policy
    const hall = await Hall.findByPk(hallId);
    if (!hall) {
      return {
        success: false,
        error: 'القاعة المطلوبة غير موجودة في النظام',
        errorCode: 'HALL_NOT_FOUND'
      };
    }

    // Clean up any naturally expired holds first
    await this.cleanupExpiredHolds(hallId, dateStr);

    // Resolve Provider Booking Policy
    const providerId = hall.providerId || 0;
    const policySnapshot = await bookingPolicyService.resolveEffectiveBookingPolicy({
      providerId,
      hallId
    });
    const policy = policySnapshot.policy;

    // Calculate TTL based on Policy
    const ttlSeconds =
      policy === 'INSTANT_CONFIRMATION'
        ? this.TTL_INSTANT_CONFIRMATION_SECONDS
        : this.TTL_APPROVAL_DECISION_SECONDS;

    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const holdToken = `HLD-${crypto.randomBytes(12).toString('hex').toUpperCase()}`;

    // Execute within an atomic transaction with row locks / isolation
    const result = await sequelize.transaction(async (t: Transaction) => {
      const conflictingPeriods = PeriodConflictService.getConflictingPeriods(period);

      // 1. Check existing active bookings in the conflicting periods
      const conflictingBooking = await Booking.findOne({
        where: {
          hallId,
          bookingDate: dateStr,
          bookingPeriod: {
            [Op.in]: conflictingPeriods
          },
          status: {
            [Op.notIn]: ['CANCELLED', 'REJECTED', 'EXPIRED', 'FAILED']
          },
          lifecycleStatus: {
            [Op.notIn]: ['CANCELLED', 'REJECTED', 'EXPIRED', 'FULFILLED', 'TERMINATED']
          }
        },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (conflictingBooking) {
        return {
          success: false,
          error: `الفترة المطلوبة (${PeriodConflictService.toArabicPeriod(period)}) محجوزة بالفعل بهذا التاريخ`,
          errorCode: 'PERIOD_UNAVAILABLE' as const
        };
      }

      // 2. Check external or manual blocked dates
      const conflictingBlock = await ExternalBlockedDate.findOne({
        where: {
          entityId: hallId,
          entityType: 'hall',
          status: 'active',
          startDate: { [Op.lte]: dateStr },
          endDate: { [Op.gte]: dateStr }
        },
        transaction: t
      });

      if (conflictingBlock) {
        const blockPeriod = PeriodConflictService.normalizePeriod(conflictingBlock.period);
        if (PeriodConflictService.doPeriodsConflict(period, blockPeriod)) {
          return {
            success: false,
            error: `الفترة المطلوبة محظورة أو معطلة من قبل إدارة القاعة: ${conflictingBlock.reason || 'غير متاحة'}`,
            errorCode: 'PERIOD_UNAVAILABLE' as const
          };
        }
      }

      // 3. Check existing active holds in conflicting periods
      const conflictingHold = await BookingHold.findOne({
        where: {
          hallId,
          bookingDate: dateStr,
          status: 'ACTIVE',
          expiresAt: { [Op.gt]: new Date() },
          period: {
            [Op.in]: conflictingPeriods
          }
        },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (conflictingHold) {
        // If the hold belongs to the same user and token hasn't expired, allow reuse/refresh
        if (
          params.userId &&
          conflictingHold.userId &&
          conflictingHold.userId === params.userId &&
          conflictingHold.period === period
        ) {
          // Extend expiration
          conflictingHold.expiresAt = expiresAt;
          await conflictingHold.save({ transaction: t });
          return {
            success: true,
            hold: conflictingHold,
            holdToken: conflictingHold.holdToken,
            expiresAt: conflictingHold.expiresAt,
            ttlSeconds,
            policy
          };
        }

        return {
          success: false,
          error: `توجد عملية حجز جارية حالياً لحماية هذه الفترة حتى ${conflictingHold.expiresAt.toLocaleTimeString('ar-SA')}`,
          errorCode: 'PERIOD_HOLD_ACTIVE' as const
        };
      }

      // 4. Create new Active Hold
      const newHold = await BookingHold.create(
        {
          holdToken,
          hallId,
          bookingDate: dateStr,
          period,
          userId: params.userId || null,
          sessionId: params.sessionId || null,
          policy,
          status: 'ACTIVE',
          expiresAt
        },
        { transaction: t }
      );

      return {
        success: true,
        hold: newHold,
        holdToken: newHold.holdToken,
        expiresAt: newHold.expiresAt,
        ttlSeconds,
        policy
      };
    });

    return result;
  }

  /**
   * Validates if a given holdToken is active, valid for the requested hall, date, and period.
   */
  public static async verifyHold(
    holdToken: string,
    hallId: number,
    date: string,
    period: BookingPeriod | string
  ): Promise<VerificationResult> {
    if (!holdToken) {
      return { isValid: false, reason: 'معرّف الحجز المؤقت مفقود' };
    }

    const dateStr = PeriodConflictService.normalizeDate(date);
    const normPeriod = PeriodConflictService.normalizePeriod(period);

    const hold = await BookingHold.findOne({
      where: {
        holdToken,
        hallId,
        bookingDate: dateStr,
        status: 'ACTIVE'
      }
    });

    if (!hold) {
      return { isValid: false, reason: 'الحجز المؤقت غير موجود أو انتهت صلاحيته' };
    }

    if (new Date() > new Date(hold.expiresAt)) {
      hold.status = 'EXPIRED';
      await hold.save();
      return { isValid: false, reason: 'انتهت مهلة الحجز المؤقت الممنوحة للدفع أو الموافقة' };
    }

    if (hold.period !== normPeriod) {
      return { isValid: false, reason: 'فترة الحجز المؤقت لا تطابق الفترة المطلوبة' };
    }

    return { isValid: true, hold };
  }

  /**
   * Converts an active hold into a confirmed booking.
   */
  public static async convertHold(holdToken: string, transaction?: Transaction): Promise<boolean> {
    if (!holdToken) return false;

    const [updatedCount] = await BookingHold.update(
      { status: 'CONVERTED' },
      {
        where: { holdToken, status: 'ACTIVE' },
        transaction
      }
    );

    return updatedCount > 0;
  }

  /**
   * Manually release an active hold (e.g. when user abandons or cancels checkout).
   */
  public static async releaseHold(holdToken: string): Promise<boolean> {
    if (!holdToken) return false;

    const [updatedCount] = await BookingHold.update(
      { status: 'RELEASED' },
      {
        where: { holdToken, status: 'ACTIVE' }
      }
    );

    return updatedCount > 0;
  }

  /**
   * Background or on-demand cleanup of expired holds.
   */
  public static async cleanupExpiredHolds(hallId?: number, date?: string): Promise<number> {
    const whereClause: any = {
      status: 'ACTIVE',
      expiresAt: { [Op.lt]: new Date() }
    };

    if (hallId) whereClause.hallId = hallId;
    if (date) whereClause.bookingDate = PeriodConflictService.normalizeDate(date);

    const [updatedCount] = await BookingHold.update(
      { status: 'EXPIRED' },
      { where: whereClause }
    );

    return updatedCount;
  }
}
