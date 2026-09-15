/**
 * Booking & Service Request Lifecycle State Machine (P2.1)
 * Enforces the 8 orthogonal state axes across the 4 approved booking policies:
 * 1. INSTANT_CONFIRMATION (الحجز الفوري)
 * 2. APPROVAL_BEFORE_PAYMENT (الموافقة قبل الدفع)
 * 3. PAYMENT_BEFORE_APPROVAL (الدفع قبل موافقة المزود)
 * 4. AUTHORIZE_THEN_CAPTURE (التفويض ثم التحصيل بعد الموافقة)
 */

import {
  BookingLifecycleStatus,
  ProviderDecisionStatus,
  PaymentExecutionState,
  RefundExecutionState,
  DisputeExecutionState,
  FulfillmentExecutionState,
  EntitlementExecutionState,
  SettlementExecutionState,
  BookingPaymentPolicy
} from '../../types/index.js';
import { LifecycleAuditService } from './LifecycleAuditService.js';
import { regulatoryPeriodService } from '../bookingPolicy/regulatoryPeriodService.js';

export enum BookingState {
  DRAFT = 'DRAFT',
  REQUESTED = 'REQUESTED',
  AWAITING_PROVIDER_DECISION = 'AWAITING_PROVIDER_DECISION',
  PROVIDER_ACCEPTED = 'PROVIDER_ACCEPTED',
  AWAITING_PAYMENT = 'AWAITING_PAYMENT',
  PAYMENT_EXPIRED = 'PAYMENT_EXPIRED',
  CONFIRMED = 'CONFIRMED',
  IN_EXECUTION = 'IN_EXECUTION',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentState {
  UNPAID = 'UNPAID',
  AUTHORIZED = 'AUTHORIZED',
  AWAITING_PAYMENT = 'AWAITING_PAYMENT',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED',
  VOIDED = 'VOIDED'
}

export type LifecycleAction =
  | 'INITIALIZE'
  | 'PROVIDER_ACCEPT'
  | 'PROVIDER_REJECT'
  | 'PAYMENT_AUTHORIZED'
  | 'PAYMENT_CAPTURED'
  | 'PAYMENT_FAILED'
  | 'PROVIDER_TIMEOUT'
  | 'PAYMENT_EXPIRED'
  | 'START_EXECUTION'
  | 'COMPLETE_FULFILLMENT'
  | 'RAISE_DISPUTE'
  | 'RESOLVE_DISPUTE'
  | 'REQUEST_REFUND'
  | 'PROCESS_REFUND'
  | 'MATURE_ENTITLEMENT'
  | 'SETTLE_PAYOUT'
  | 'CANCEL';

export interface LifecycleTransitionMetadata {
  actorId?: number;
  actorRole?: 'customer' | 'provider' | 'admin' | 'system' | string;
  paymentDeadlineHours?: number;
  paymentReference?: string;
  paymentMethod?: string;
  paidAmount?: number;
  rejectionReason?: string;
  cancellationReason?: string;
  disputeReason?: string;
  refundAmount?: number;
  [key: string]: any;
}

export class BookingStateMachine {
  /**
   * Allowed transitions for canonical lifecycleStatus
   */
  private static readonly ALLOWED_TRANSITIONS: Record<string, string[]> = {
    DRAFT: ['REQUESTED', 'CANCELLED'],
    REQUESTED: ['AWAITING_PROVIDER', 'AWAITING_PROVIDER_DECISION', 'PROVIDER_ACCEPTED', 'CONFIRMED', 'REJECTED', 'EXPIRED', 'CANCELLED'],
    AWAITING_PROVIDER: ['PROVIDER_ACCEPTED', 'CONFIRMED', 'REJECTED', 'EXPIRED', 'CANCELLED'],
    AWAITING_PROVIDER_DECISION: ['PROVIDER_ACCEPTED', 'CONFIRMED', 'REJECTED', 'EXPIRED', 'CANCELLED'],
    PROVIDER_ACCEPTED: ['CONFIRMED', 'AWAITING_PAYMENT', 'PAYMENT_EXPIRED', 'CANCELLED'],
    AWAITING_PAYMENT: ['CONFIRMED', 'PAYMENT_EXPIRED', 'CANCELLED'],
    CONFIRMED: ['IN_EXECUTION', 'COMPLETED', 'CANCELLED'],
    IN_EXECUTION: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    REJECTED: [],
    EXPIRED: [],
    PAYMENT_EXPIRED: [],
    CANCELLED: []
  };

  /**
   * Normalizes legacy status string to canonical uppercase
   */
  public static normalizeState(status: string | undefined | null): BookingLifecycleStatus {
    if (!status) return 'REQUESTED';
    const s = String(status).toUpperCase().trim();
    if (s === 'PENDING' || s === 'قيد الانتظار' || s === 'NEW' || s === 'REQUESTED') return 'REQUESTED';
    if (s === 'AWAITING_PROVIDER' || s === 'بانتظار المزود' || s === 'AWAITING_PROVIDER_DECISION') return 'AWAITING_PROVIDER';
    if (s === 'ACCEPTED' || s === 'مقبول' || s === 'PROVIDER_APPROVED' || s === 'PROVIDER_ACCEPTED') return 'PROVIDER_ACCEPTED';
    if (s === 'AWAITING_PAYMENT' || s === 'في انتظار السداد' || s === 'في انتظار الدفع' || s === 'معتمد - بانتظار السداد') return 'PROVIDER_ACCEPTED';
    if (s === 'CONFIRMED' || s === 'مؤكد') return 'CONFIRMED';
    if (s === 'IN_EXECUTION' || s === 'جاري التنفيذ' || s === 'UPCOMING' || s === 'قيد التنفيذ') return 'IN_EXECUTION';
    if (s === 'COMPLETED' || s === 'مكتمل' || s === 'منتهي') return 'COMPLETED';
    if (s === 'REJECTED' || s === 'مرفوض') return 'REJECTED';
    if (s === 'EXPIRED' || s === 'منتهي الصلاحية') return 'EXPIRED';
    if (s === 'PAYMENT_EXPIRED' || s === 'فائت السداد') return 'EXPIRED';
    if (s === 'CANCELLED' || s === 'ملغي' || s === 'ملغى') return 'CANCELLED';

    return 'REQUESTED';
  }

  /**
   * Normalizes payment status strings
   */
  public static normalizePaymentState(status: string | undefined | null): PaymentExecutionState {
    if (!status) return 'UNPAID';
    const s = String(status).toUpperCase().trim();
    if (s === 'PAID' || s === 'مدفوع' || s === 'مدفوع بالكامل') return 'PAID';
    if (s === 'AUTHORIZED' || s === 'مفوض') return 'AUTHORIZED';
    if (s === 'AWAITING_PAYMENT' || s === 'في انتظار التحويل' || s === 'في انتظار السداد') return 'AWAITING_PAYMENT';
    if (s === 'PROCESSING' || s === 'قيد المعالجة') return 'PROCESSING';
    if (s === 'FAILED' || s === 'فشل السداد') return 'FAILED';
    if (s === 'REFUNDED' || s === 'مسترجع' || s === 'مسترجع بالكامل') return 'VOIDED';
    if (s === 'VOIDED' || s === 'ملغي') return 'VOIDED';
    return 'UNPAID';
  }

  /**
   * Normalizes policy string to standard BookingPaymentPolicy enum
   */
  public static normalizePolicy(policy: string | undefined | null): BookingPaymentPolicy {
    if (!policy) return 'APPROVAL_BEFORE_PAYMENT';
    const p = String(policy).toUpperCase().trim();
    if (p.includes('INSTANT')) return 'INSTANT_CONFIRMATION';
    if (p.includes('BEFORE_APPROVAL') || p.includes('PAY_BEFORE')) return 'PAYMENT_BEFORE_APPROVAL';
    if (p.includes('AUTHORIZE') || p.includes('AUTH_THEN')) return 'AUTHORIZE_THEN_CAPTURE';
    return 'APPROVAL_BEFORE_PAYMENT';
  }

  /**
   * Computes the initial 8 axes when a Booking or Service Request is first created
   */
  public static computeInitialAxes(params: {
    policy: BookingPaymentPolicy;
    isExternal?: boolean;
    hasPrePaid?: boolean;
    hasAuthorized?: boolean;
  }): {
    lifecycleStatus: BookingLifecycleStatus;
    providerDecision: ProviderDecisionStatus;
    paymentState: PaymentExecutionState;
    refundState: RefundExecutionState;
    disputeState: DisputeExecutionState;
    fulfillmentState: FulfillmentExecutionState;
    entitlementState: EntitlementExecutionState;
    settlementState: SettlementExecutionState;
    legacyStatus: string;
    legacyPaymentStatus: string;
  } {
    const { policy, isExternal, hasPrePaid, hasAuthorized } = params;

    if (isExternal) {
      return {
        lifecycleStatus: 'CONFIRMED',
        providerDecision: 'AUTO_ACCEPTED',
        paymentState: 'PAID',
        refundState: 'NONE',
        disputeState: 'NONE',
        fulfillmentState: 'NOT_STARTED',
        entitlementState: 'PENDING_HOLD',
        settlementState: 'UNSETTLED',
        legacyStatus: 'confirmed',
        legacyPaymentStatus: 'مدفوع'
      };
    }

    switch (policy) {
      case 'INSTANT_CONFIRMATION':
        if (hasPrePaid) {
          return {
            lifecycleStatus: 'CONFIRMED',
            providerDecision: 'AUTO_ACCEPTED',
            paymentState: 'PAID',
            refundState: 'NONE',
            disputeState: 'NONE',
            fulfillmentState: 'NOT_STARTED',
            entitlementState: 'PENDING_HOLD',
            settlementState: 'UNSETTLED',
            legacyStatus: 'confirmed',
            legacyPaymentStatus: 'مدفوع'
          };
        }
        return {
          lifecycleStatus: 'REQUESTED',
          providerDecision: 'AUTO_ACCEPTED',
          paymentState: 'UNPAID',
          refundState: 'NONE',
          disputeState: 'NONE',
          fulfillmentState: 'NOT_STARTED',
          entitlementState: 'PENDING_HOLD',
          settlementState: 'UNSETTLED',
          legacyStatus: 'pending',
          legacyPaymentStatus: 'UNPAID'
        };

      case 'PAYMENT_BEFORE_APPROVAL':
        return {
          lifecycleStatus: 'REQUESTED',
          providerDecision: 'PENDING',
          paymentState: hasPrePaid ? 'PAID' : 'AWAITING_PAYMENT',
          refundState: 'NONE',
          disputeState: 'NONE',
          fulfillmentState: 'NOT_STARTED',
          entitlementState: 'PENDING_HOLD',
          settlementState: 'UNSETTLED',
          legacyStatus: 'pending',
          legacyPaymentStatus: hasPrePaid ? 'مدفوع' : 'UNPAID'
        };

      case 'AUTHORIZE_THEN_CAPTURE':
        return {
          lifecycleStatus: 'REQUESTED',
          providerDecision: 'PENDING',
          paymentState: hasAuthorized ? 'AUTHORIZED' : 'UNPAID',
          refundState: 'NONE',
          disputeState: 'NONE',
          fulfillmentState: 'NOT_STARTED',
          entitlementState: 'PENDING_HOLD',
          settlementState: 'UNSETTLED',
          legacyStatus: 'pending',
          legacyPaymentStatus: hasAuthorized ? 'AUTHORIZED' : 'UNPAID'
        };

      case 'APPROVAL_BEFORE_PAYMENT':
      default:
        return {
          lifecycleStatus: 'REQUESTED',
          providerDecision: 'PENDING',
          paymentState: 'UNPAID',
          refundState: 'NONE',
          disputeState: 'NONE',
          fulfillmentState: 'NOT_STARTED',
          entitlementState: 'PENDING_HOLD',
          settlementState: 'UNSETTLED',
          legacyStatus: 'pending',
          legacyPaymentStatus: 'UNPAID'
        };
    }
  }

  /**
   * Validates if payment checkout/gateway intent is legally allowed
   */
  public static isPaymentCheckoutAllowed(booking: {
    status?: string;
    lifecycleStatus?: string;
    providerDecision?: string;
    paymentState?: string;
    paymentStatus?: string;
    bookingPaymentPolicy?: string;
    paymentDeadline?: Date | string | null;
  }): { allowed: boolean; reason?: string } {
    const policy = this.normalizePolicy(booking.bookingPaymentPolicy);
    const paymentState = this.normalizePaymentState(booking.paymentState || booking.paymentStatus);
    const providerDecision = (booking.providerDecision || 'PENDING').toUpperCase();
    const lifecycle = this.normalizeState(booking.lifecycleStatus || booking.status);

    if (paymentState === 'PAID') {
      return { allowed: false, reason: 'تم سداد قيمة هذا الحجز بالكامل مسبقاً.' };
    }

    if (lifecycle === 'CANCELLED' || lifecycle === 'REJECTED' || lifecycle === 'EXPIRED') {
      return { allowed: false, reason: `لا يمكن الدفع لحجز في الحالة النهائية (${lifecycle}).` };
    }

    // Policy-specific eligibility
    if (policy === 'APPROVAL_BEFORE_PAYMENT') {
      if (providerDecision !== 'ACCEPTED') {
        return {
          allowed: false,
          reason: 'لا يمكن فتح نافذة الدفع إلا بعد موافقة مزود الخدمة على الحجز أولاً وفق سياسة (الموافقة قبل الدفع).'
        };
      }
    }

    // Check payment deadline if present
    if (booking.paymentDeadline) {
      const deadline = new Date(booking.paymentDeadline);
      if (new Date() > deadline) {
        return {
          allowed: false,
          reason: 'انتهت المهلة النظامية المحددة لسداد الحجز (Payment Deadline Expired).'
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Executes an atomic state transition on a Booking instance across all 8 axes
   */
  public static async transition(
    booking: any,
    action: LifecycleAction,
    metadata?: LifecycleTransitionMetadata
  ): Promise<any> {
    const now = new Date();
    const policy = this.normalizePolicy(booking.bookingPaymentPolicy);
    const fromState = booking.lifecycleStatus || booking.status || 'REQUESTED';

    const actorId = metadata?.actorId || null;
    const actorRole = metadata?.actorRole || 'system';

    switch (action) {
      case 'PROVIDER_ACCEPT': {
        booking.providerDecision = 'ACCEPTED';
        booking.acceptedAt = now;
        booking.acceptedBy = actorId;

        if (policy === 'APPROVAL_BEFORE_PAYMENT') {
          let hours = metadata?.paymentDeadlineHours;
          if (!hours) {
            try {
              const sovereignConfig = await regulatoryPeriodService.getRegulatoryConfig();
              hours = sovereignConfig.deadlines?.customerPaymentDeadlines?.APPROVAL_BEFORE_PAYMENT || 2;
            } catch (e) {
              hours = 2;
            }
          }
          booking.paymentDeadline = new Date(now.getTime() + hours * 60 * 60 * 1000);
          booking.lifecycleStatus = 'PROVIDER_ACCEPTED';
          booking.status = 'PROVIDER_ACCEPTED';
          booking.paymentState = 'UNPAID';
        } else if (policy === 'PAYMENT_BEFORE_APPROVAL') {
          // Customer already paid; Provider acceptance immediately confirms booking
          booking.lifecycleStatus = 'CONFIRMED';
          booking.status = 'confirmed';
          booking.paymentState = 'PAID';
          booking.paymentStatus = 'مدفوع';
        } else if (policy === 'AUTHORIZE_THEN_CAPTURE') {
          // Provider accepted; capture authorization
          booking.lifecycleStatus = 'CONFIRMED';
          booking.status = 'confirmed';
          booking.paymentState = 'PAID';
          booking.paymentStatus = 'مدفوع';
          booking.paidAt = now;
        } else if (policy === 'INSTANT_CONFIRMATION') {
          booking.lifecycleStatus = 'CONFIRMED';
          booking.status = 'confirmed';
        }
        break;
      }

      case 'PROVIDER_REJECT': {
        booking.providerDecision = 'REJECTED';
        booking.rejectedAt = now;
        booking.rejectedBy = actorId;
        booking.rejectionReason = metadata?.rejectionReason || 'اعتذار المزود عن قبول الحجز';
        booking.lifecycleStatus = 'REJECTED';
        booking.status = 'rejected';

        // If customer was charged beforehand (e.g. PAYMENT_BEFORE_APPROVAL), initiate refund state
        if (booking.paymentState === 'PAID' || booking.paymentStatus === 'مدفوع') {
          booking.refundState = 'APPROVED';
          booking.refundReason = 'استرداد تلقائي لاعتذار المزود عن الحجز';
        } else if (booking.paymentState === 'AUTHORIZED') {
          booking.paymentState = 'VOIDED';
        }
        break;
      }

      case 'PAYMENT_CAPTURED': {
        booking.paymentState = 'PAID';
        booking.paymentStatus = 'مدفوع';
        booking.paidAt = now;
        booking.paymentReference = metadata?.paymentReference || booking.paymentReference;
        booking.paymentMethod = metadata?.paymentMethod || booking.paymentMethod;

        if (policy === 'APPROVAL_BEFORE_PAYMENT' || policy === 'INSTANT_CONFIRMATION') {
          booking.lifecycleStatus = 'CONFIRMED';
          booking.status = 'confirmed';
        } else if (policy === 'PAYMENT_BEFORE_APPROVAL') {
          // Paid, still awaiting provider decision
          if (booking.providerDecision === 'ACCEPTED') {
            booking.lifecycleStatus = 'CONFIRMED';
            booking.status = 'confirmed';
          } else {
            booking.lifecycleStatus = 'AWAITING_PROVIDER';
            booking.status = 'pending';
          }
        }
        break;
      }

      case 'PAYMENT_AUTHORIZED': {
        booking.paymentState = 'AUTHORIZED';
        booking.paymentReference = metadata?.paymentReference || booking.paymentReference;
        booking.lifecycleStatus = 'AWAITING_PROVIDER';
        booking.status = 'pending';
        break;
      }

      case 'PROVIDER_TIMEOUT': {
        booking.providerDecision = 'TIMED_OUT';
        booking.lifecycleStatus = 'EXPIRED';
        booking.status = 'expired';
        booking.rejectionReason = 'انتهاء مهلة استجابة المزود المحددة نظاماً دون اتخاذ قرار';

        if (booking.paymentState === 'PAID' || booking.paymentStatus === 'مدفوع') {
          booking.refundState = 'APPROVED';
          booking.refundReason = 'استرداد تلقائي لانتهاء مهلة رد المزود';
        } else if (booking.paymentState === 'AUTHORIZED') {
          booking.paymentState = 'VOIDED';
        }
        break;
      }

      case 'PAYMENT_EXPIRED': {
        booking.lifecycleStatus = 'EXPIRED';
        booking.status = 'expired';
        booking.paymentState = 'VOIDED';
        booking.paymentStatus = 'UNPAID';
        booking.rejectionReason = 'انتهاء مهلة سداد الحجز الممنوحة للعميل بعد قبول المزود';
        break;
      }

      case 'START_EXECUTION': {
        booking.fulfillmentState = 'IN_PROGRESS';
        booking.lifecycleStatus = 'IN_EXECUTION';
        booking.status = 'IN_EXECUTION';
        break;
      }

      case 'COMPLETE_FULFILLMENT': {
        booking.fulfillmentState = 'DELIVERED';
        booking.lifecycleStatus = 'COMPLETED';
        booking.status = 'completed';
        booking.entitlementState = 'MATURED';
        break;
      }

      case 'RAISE_DISPUTE': {
        booking.disputeState = 'OPEN';
        booking.entitlementState = 'BLOCKED_DISPUTE';
        booking.disputeReason = metadata?.disputeReason || 'نزاع مفتوح على الحجز';
        break;
      }

      case 'RESOLVE_DISPUTE': {
        const resolution = metadata?.resolution || 'RESOLVED_CLIENT';
        booking.disputeState = resolution;
        if (resolution === 'RESOLVED_CLIENT') {
          booking.refundState = 'APPROVED';
          booking.entitlementState = 'FORFEITED';
        } else {
          booking.entitlementState = 'MATURED';
        }
        break;
      }

      case 'CANCEL': {
        booking.lifecycleStatus = 'CANCELLED';
        booking.status = 'cancelled';
        booking.cancelledAt = now;
        booking.cancelledBy = String(actorRole);
        booking.cancellationReason = metadata?.cancellationReason || 'إلغاء الحجز';

        if (booking.paymentState === 'AUTHORIZED') {
          booking.paymentState = 'VOIDED';
        } else if (booking.paymentState === 'PAID') {
          booking.refundState = 'REQUESTED';
        }
        break;
      }

      default:
        break;
    }

    if (typeof booking.save === 'function') {
      await booking.save();
    }

    const toState = booking.lifecycleStatus || booking.status;

    // Record Audit Log & Publish Domain Event
    await LifecycleAuditService.recordTransition({
      aggregateType: 'Booking',
      aggregateId: booking.id,
      fromState: String(fromState),
      toState: String(toState),
      action,
      actorId,
      actorRole,
      reason: metadata?.rejectionReason || metadata?.cancellationReason || null,
      metadata: {
        policy,
        providerDecision: booking.providerDecision,
        paymentState: booking.paymentState,
        refundState: booking.refundState,
        disputeState: booking.disputeState,
        fulfillmentState: booking.fulfillmentState,
        entitlementState: booking.entitlementState,
        settlementState: booking.settlementState
      }
    });

    await LifecycleAuditService.publishDomainEvent({
      eventType: `BOOKING_${action}`,
      aggregateType: 'Booking',
      aggregateId: booking.id,
      actorId,
      actorRole,
      payload: {
        action,
        policy,
        bookingNumber: booking.bookingNumber,
        hallId: booking.hallId,
        userId: booking.userId
      },
      stateSnapshot: {
        lifecycleStatus: booking.lifecycleStatus,
        providerDecision: booking.providerDecision,
        paymentState: booking.paymentState,
        refundState: booking.refundState,
        disputeState: booking.disputeState,
        fulfillmentState: booking.fulfillmentState,
        entitlementState: booking.entitlementState,
        settlementState: booking.settlementState
      }
    });

    return booking;
  }
}
