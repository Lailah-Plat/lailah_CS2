/**
 * @file regulatoryPeriodService.ts
 * @description P2.3-P2.4 Sovereign Regulatory Period & Deadlines Engine
 *
 * Implements:
 * 1. Admin Sovereign Reference Times & Timeout Definitions:
 *    - Morning Period: standard default 07:00 -> 15:00
 *    - Evening Period: standard default 16:00 -> 02:00 (crossesMidnight: true)
 *    - Provider Response Deadlines & Customer Payment Deadlines per policy
 * 2. Audit Trail of all Administrative Timing Changes (RegulatoryPeriodAuditLog)
 * 3. Immutable Snapshotting per Booking at creation time (`periodSnapshot`).
 * 4. Strictly forward-looking changes: Updates in security settings affect future operations only,
 *    and NEVER retroactively modify historical bookings or existing contracts.
 */

import { PlatformConfig } from '../../models/UserModels.js';
import { BookingPeriod } from '../../types/index.js';
import { PeriodConflictService } from './periodConflictService.js';
import { sequelize } from '../../models/dbInstance.js';
import { DataTypes, Model } from 'sequelize';

export interface RegulatoryPeriodTiming {
  startTime: string; // "07:00"
  endTime: string;   // "15:00"
  crossesMidnight?: boolean; // true for 16:00 -> 02:00
  displayNameAr: string;
  durationHours: number;
}

export interface RegulatoryPeriodsConfig {
  version: number;
  updatedAt: string;
  updatedBy?: string | number;
  effectiveFrom?: string; // ISO date string
  morning: RegulatoryPeriodTiming;
  evening: RegulatoryPeriodTiming;
  fullDay: {
    displayNameAr: string;
    descriptionAr: string;
  };
  deadlines: {
    sovereignProviderResponseDeadlineHours: number; // default 1
    holdTtlMinutes: number; // default 15
    customerPaymentDeadlines: {
      APPROVAL_BEFORE_PAYMENT: number; // 2 hours
      PAYMENT_BEFORE_APPROVAL: number; // 1 hour
      INSTANT_CONFIRMATION: number;    // 0.5 hours (30 min)
      AUTHORIZE_THEN_CAPTURE: number;  // 0.5 hours (30 min)
    };
    maxPaymentAttempts: number; // default 3
  };
}

export interface BookingPeriodSnapshot {
  period: BookingPeriod;
  periodArabic: string;
  startTimeRegulatory: string;
  endTimeRegulatory: string;
  crossesMidnight: boolean;
  configVersion: number;
  resolvedAt: string;
  effectiveDate: string; // YYYY-MM-DD
}

export const DEFAULT_REGULATORY_CONFIG: RegulatoryPeriodsConfig = {
  version: 1,
  updatedAt: '2026-01-01T00:00:00.000Z',
  updatedBy: 'system',
  effectiveFrom: '2026-01-01T00:00:00.000Z',
  morning: {
    startTime: '07:00',
    endTime: '15:00',
    crossesMidnight: false,
    displayNameAr: 'الفترة الصباحية',
    durationHours: 8
  },
  evening: {
    startTime: '16:00',
    endTime: '02:00',
    crossesMidnight: true,
    displayNameAr: 'الفترة المسائية',
    durationHours: 10
  },
  fullDay: {
    displayNameAr: 'يوم كامل (شامل الفترتين)',
    descriptionAr: 'حجز المنشأة لكامل اليوم بجميع فتراته التنظيمية'
  },
  deadlines: {
    sovereignProviderResponseDeadlineHours: 1,
    holdTtlMinutes: 15,
    customerPaymentDeadlines: {
      APPROVAL_BEFORE_PAYMENT: 2,
      PAYMENT_BEFORE_APPROVAL: 1,
      INSTANT_CONFIRMATION: 0.5,
      AUTHORIZE_THEN_CAPTURE: 0.5
    },
    maxPaymentAttempts: 3
  }
};

/**
 * RegulatoryPeriodAuditLog Model for tracking admin changes to periods & deadlines
 */
export class RegulatoryPeriodAuditLog extends Model {
  declare id: number;
  declare configVersion: number;
  declare previousConfig: string;
  declare newConfig: string;
  declare changedBy: string;
  declare actorId: number | null;
  declare reason: string | null;
  declare effectiveDate: string | null;
  declare createdAt?: Date;
}

RegulatoryPeriodAuditLog.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  configVersion: { type: DataTypes.INTEGER, allowNull: false },
  previousConfig: { type: DataTypes.TEXT, allowNull: false },
  newConfig: { type: DataTypes.TEXT, allowNull: false },
  changedBy: { type: DataTypes.STRING, allowNull: false, defaultValue: 'admin' },
  actorId: { type: DataTypes.INTEGER, allowNull: true },
  reason: { type: DataTypes.TEXT, allowNull: true },
  effectiveDate: { type: DataTypes.STRING, allowNull: true }
}, {
  sequelize,
  modelName: 'RegulatoryPeriodAuditLog',
  tableName: 'regulatory_period_audit_logs'
});

export class RegulatoryPeriodService {
  private static instance: RegulatoryPeriodService;

  private constructor() {}

  public static getInstance(): RegulatoryPeriodService {
    if (!RegulatoryPeriodService.instance) {
      RegulatoryPeriodService.instance = new RegulatoryPeriodService();
    }
    return RegulatoryPeriodService.instance;
  }

  /**
   * Loads the current Sovereign Regulatory Configuration from PlatformConfig
   */
  public async getRegulatoryConfig(): Promise<RegulatoryPeriodsConfig> {
    try {
      const row = await PlatformConfig.findByPk('SYSTEM_REGULATORY_PERIODS_AND_TIMEOUTS');
      if (row && row.value) {
        const parsed = JSON.parse(row.value);
        return {
          version: Number(parsed.version) || 1,
          updatedAt: parsed.updatedAt || new Date().toISOString(),
          updatedBy: parsed.updatedBy || 'admin',
          effectiveFrom: parsed.effectiveFrom || '2026-01-01T00:00:00.000Z',
          morning: {
            ...DEFAULT_REGULATORY_CONFIG.morning,
            ...(parsed.morning || {})
          },
          evening: {
            ...DEFAULT_REGULATORY_CONFIG.evening,
            ...(parsed.evening || {})
          },
          fullDay: {
            ...DEFAULT_REGULATORY_CONFIG.fullDay,
            ...(parsed.fullDay || {})
          },
          deadlines: {
            ...DEFAULT_REGULATORY_CONFIG.deadlines,
            ...(parsed.deadlines || {}),
            customerPaymentDeadlines: {
              ...DEFAULT_REGULATORY_CONFIG.deadlines.customerPaymentDeadlines,
              ...(parsed.deadlines?.customerPaymentDeadlines || {})
            }
          }
        };
      }
    } catch (err: any) {
      console.warn('[RegulatoryPeriodService] Warning reading regulatory config from DB:', err.message);
    }
    return { ...DEFAULT_REGULATORY_CONFIG };
  }

  /**
   * Updates Regulatory Configuration with Admin Sovereign Authority & creates audit log
   */
  public async updateRegulatoryConfig(params: {
    morning?: Partial<RegulatoryPeriodTiming>;
    evening?: Partial<RegulatoryPeriodTiming>;
    deadlines?: Partial<RegulatoryPeriodsConfig['deadlines']>;
    reason?: string;
    effectiveFrom?: string;
    actorId?: number;
    actorName?: string;
  }): Promise<{ success: boolean; config: RegulatoryPeriodsConfig; message: string }> {
    const current = await this.getRegulatoryConfig();
    const newVersion = current.version + 1;

    const updatedConfig: RegulatoryPeriodsConfig = {
      version: newVersion,
      updatedAt: new Date().toISOString(),
      updatedBy: params.actorName || (params.actorId ? `Admin #${params.actorId}` : 'admin'),
      effectiveFrom: params.effectiveFrom || new Date().toISOString(),
      morning: {
        ...current.morning,
        ...(params.morning || {})
      },
      evening: {
        ...current.evening,
        ...(params.evening || {})
      },
      fullDay: current.fullDay,
      deadlines: {
        ...current.deadlines,
        ...(params.deadlines || {}),
        customerPaymentDeadlines: {
          ...current.deadlines.customerPaymentDeadlines,
          ...(params.deadlines?.customerPaymentDeadlines || {})
        }
      }
    };

    // Calculate duration for morning & evening
    if (params.morning?.startTime || params.morning?.endTime) {
      updatedConfig.morning.durationHours = this.calculateHoursDiff(
        updatedConfig.morning.startTime,
        updatedConfig.morning.endTime,
        false
      );
    }
    if (params.evening?.startTime || params.evening?.endTime) {
      const isCross = this.doesCrossMidnight(
        updatedConfig.evening.startTime,
        updatedConfig.evening.endTime
      );
      updatedConfig.evening.crossesMidnight = isCross;
      updatedConfig.evening.durationHours = this.calculateHoursDiff(
        updatedConfig.evening.startTime,
        updatedConfig.evening.endTime,
        isCross
      );
    }

    // Persist in PlatformConfig
    await PlatformConfig.upsert({
      key: 'SYSTEM_REGULATORY_PERIODS_AND_TIMEOUTS',
      value: JSON.stringify(updatedConfig)
    });

    // Save Audit Record
    try {
      await RegulatoryPeriodAuditLog.create({
        configVersion: newVersion,
        previousConfig: JSON.stringify(current),
        newConfig: JSON.stringify(updatedConfig),
        changedBy: updatedConfig.updatedBy || 'admin',
        actorId: params.actorId || null,
        reason: params.reason || 'تحديث المهل والأوقات التنظيمية السيادية للفترات من إعدادات الأمان',
        effectiveDate: updatedConfig.effectiveFrom || new Date().toISOString().split('T')[0]
      });
    } catch (auditErr: any) {
      console.warn('[RegulatoryPeriodService] Audit log creation warning:', auditErr.message);
    }

    return {
      success: true,
      config: updatedConfig,
      message: 'تم تحديث الأوقات والمهل التنظيمية السيادية بنجاح. التعديل يسري على العمليات والحجوزات المستقبلية فقط.'
    };
  }

  /**
   * Creates an immutable snapshot of regulatory timing for a booking
   */
  public async createPeriodSnapshot(
    requestedPeriod: BookingPeriod | string,
    bookingDateStr: string
  ): Promise<BookingPeriodSnapshot> {
    const normPeriod = PeriodConflictService.normalizePeriod(requestedPeriod);
    const config = await this.getRegulatoryConfig();

    let start = '00:00';
    let end = '23:59';
    let crosses = false;

    if (normPeriod === 'MORNING') {
      start = config.morning.startTime;
      end = config.morning.endTime;
      crosses = Boolean(config.morning.crossesMidnight);
    } else if (normPeriod === 'EVENING') {
      start = config.evening.startTime;
      end = config.evening.endTime;
      crosses = Boolean(config.evening.crossesMidnight);
    } else {
      // FULL_DAY
      start = config.morning.startTime;
      end = config.evening.endTime;
      crosses = Boolean(config.evening.crossesMidnight);
    }

    return {
      period: normPeriod,
      periodArabic: PeriodConflictService.toArabicPeriod(normPeriod),
      startTimeRegulatory: start,
      endTimeRegulatory: end,
      crossesMidnight: crosses,
      configVersion: config.version,
      resolvedAt: new Date().toISOString(),
      effectiveDate: bookingDateStr
    };
  }

  /**
   * Fetches audit history for regulatory period changes
   */
  public async getAuditHistory(limit: number = 20): Promise<RegulatoryPeriodAuditLog[]> {
    try {
      return await RegulatoryPeriodAuditLog.findAll({
        order: [['id', 'DESC']],
        limit
      });
    } catch (e) {
      return [];
    }
  }

  /**
   * Helper to determine if a time range crosses midnight (e.g. 16:00 to 02:00)
   */
  private doesCrossMidnight(start: string, end: string): boolean {
    const [sh] = start.split(':').map(Number);
    const [eh] = end.split(':').map(Number);
    return eh < sh;
  }

  /**
   * Helper to calculate hours difference
   */
  private calculateHoursDiff(start: string, end: string, crossesMidnight: boolean): number {
    const [sh, sm = 0] = start.split(':').map(Number);
    const [eh, em = 0] = end.split(':').map(Number);

    let startMins = sh * 60 + sm;
    let endMins = eh * 60 + em;

    if (crossesMidnight || endMins < startMins) {
      endMins += 24 * 60;
    }

    const diffMins = endMins - startMins;
    return Math.round((diffMins / 60) * 10) / 10;
  }
}

export const regulatoryPeriodService = RegulatoryPeriodService.getInstance();
