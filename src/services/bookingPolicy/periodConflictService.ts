/**
 * @file periodConflictService.ts
 * @description P2.2 - Core Period Conflict & Mapping Engine
 * Enforces the strict period conflict matrix between MORNING, EVENING, and FULL_DAY.
 */

import { BookingPeriod, ArabicPeriod } from '../../types/index.js';

export class PeriodConflictService {
  /**
   * Normalizes any input period string (Arabic or English) into standard uppercase English enum:
   * 'MORNING' | 'EVENING' | 'FULL_DAY'
   */
  public static normalizePeriod(input?: string | null): BookingPeriod {
    if (!input) return 'FULL_DAY';
    const trimmed = input.trim().toLowerCase();

    // Arabic matching
    if (trimmed.includes('صباح') || trimmed === 'morning') {
      return 'MORNING';
    }
    if (trimmed.includes('مساء') || trimmed.includes('مسائ') || trimmed === 'evening' || trimmed === 'night') {
      return 'EVENING';
    }
    if (
      trimmed.includes('يوم كامل') ||
      trimmed.includes('كافة الفترات') ||
      trimmed.includes('كامل') ||
      trimmed === 'full_day' ||
      trimmed === 'fullday'
    ) {
      return 'FULL_DAY';
    }

    // Default fallback
    return 'FULL_DAY';
  }

  /**
   * Converts standard BookingPeriod to Arabic display name.
   */
  public static toArabicPeriod(period: BookingPeriod): ArabicPeriod {
    switch (period) {
      case 'MORNING':
        return 'صباحية';
      case 'EVENING':
        return 'مسائية';
      case 'FULL_DAY':
        return 'يوم كامل';
      default:
        return 'يوم كامل';
    }
  }

  /**
   * Returns the list of conflicting periods for a requested period.
   * Strict Matrix:
   * - MORNING conflicts with: ['MORNING', 'FULL_DAY']
   * - EVENING conflicts with: ['EVENING', 'FULL_DAY']
   * - FULL_DAY conflicts with: ['MORNING', 'EVENING', 'FULL_DAY']
   */
  public static getConflictingPeriods(requestedPeriod: BookingPeriod | string): BookingPeriod[] {
    const norm = this.normalizePeriod(requestedPeriod);
    switch (norm) {
      case 'MORNING':
        return ['MORNING', 'FULL_DAY'];
      case 'EVENING':
        return ['EVENING', 'FULL_DAY'];
      case 'FULL_DAY':
        return ['MORNING', 'EVENING', 'FULL_DAY'];
      default:
        return ['MORNING', 'EVENING', 'FULL_DAY'];
    }
  }

  /**
   * Returns whether two periods conflict with each other.
   */
  public static doPeriodsConflict(periodA: BookingPeriod | string, periodB: BookingPeriod | string): boolean {
    const normA = this.normalizePeriod(periodA);
    const normB = this.normalizePeriod(periodB);

    if (normA === 'FULL_DAY' || normB === 'FULL_DAY') {
      return true;
    }
    return normA === normB;
  }

  /**
   * Normalizes a date input to 'YYYY-MM-DD'
   */
  public static normalizeDate(dateInput: Date | string | number): string {
    if (!dateInput) {
      return new Date().toISOString().split('T')[0];
    }
    if (typeof dateInput === 'string') {
      if (dateInput.includes('T')) {
        return dateInput.split('T')[0];
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        return dateInput;
      }
    }
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    return d.toISOString().split('T')[0];
  }
}
