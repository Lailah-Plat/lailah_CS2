import { SubscriptionLifecycleStatus, SubscriptionPaymentStatus } from '../../models/SubscriptionModels.js';

export interface StateTransitionResult {
  valid: boolean;
  fromStatus: SubscriptionLifecycleStatus;
  toStatus: SubscriptionLifecycleStatus;
  error?: string;
  recommendedPaymentStatus?: SubscriptionPaymentStatus;
}

/**
 * Single Authoritative State Machine for Provider Subscription Lifecycles.
 * Enforces valid state transitions and guarantees business invariants.
 */
export class SubscriptionStateMachine {
  private static readonly VALID_TRANSITIONS: Record<SubscriptionLifecycleStatus, SubscriptionLifecycleStatus[]> = {
    DRAFT: ['PENDING_PAYMENT', 'ACTIVE', 'CANCELLED'],
    PENDING_PAYMENT: ['ACTIVE', 'PAYMENT_FAILED', 'CANCELLED', 'EXPIRED'],
    ACTIVE: [
      'ACTIVE', // Self-transition on immediate plan change / renewal
      'RENEWAL_DUE',
      'GRACE_PERIOD',
      'UPGRADE_SCHEDULED',
      'DOWNGRADE_SCHEDULED',
      'PAYMENT_FAILED',
      'SUSPENDED',
      'CANCELLED',
      'EXPIRED'
    ],
    RENEWAL_DUE: ['ACTIVE', 'GRACE_PERIOD', 'PAYMENT_FAILED', 'EXPIRED', 'CANCELLED'],
    GRACE_PERIOD: ['ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED', 'PAYMENT_FAILED'],
    EXPIRED: ['PENDING_PAYMENT', 'ACTIVE', 'DRAFT'],
    CANCELLED: ['DRAFT', 'PENDING_PAYMENT'],
    SUSPENDED: ['ACTIVE', 'EXPIRED', 'CANCELLED'],
    PAYMENT_FAILED: ['PENDING_PAYMENT', 'ACTIVE', 'GRACE_PERIOD', 'EXPIRED', 'CANCELLED'],
    UPGRADE_SCHEDULED: ['ACTIVE', 'CANCELLED', 'EXPIRED', 'SUSPENDED', 'RENEWAL_DUE'],
    DOWNGRADE_SCHEDULED: ['ACTIVE', 'CANCELLED', 'EXPIRED', 'SUSPENDED', 'RENEWAL_DUE']
  };

  /**
   * Validates if a state transition from `currentStatus` to `nextStatus` is permitted.
   */
  public static isValidTransition(
    currentStatus: SubscriptionLifecycleStatus,
    nextStatus: SubscriptionLifecycleStatus
  ): boolean {
    const allowed = this.VALID_TRANSITIONS[currentStatus] || [];
    return allowed.includes(nextStatus);
  }

  /**
   * Validates if a state transition from `currentStatus` to `nextStatus` is permitted and returns details.
   */
  public static validateTransition(
    currentStatus: SubscriptionLifecycleStatus,
    nextStatus: SubscriptionLifecycleStatus
  ): StateTransitionResult {
    const allowed = this.VALID_TRANSITIONS[currentStatus] || [];
    const isValid = allowed.includes(nextStatus);

    if (!isValid) {
      return {
        valid: false,
        fromStatus: currentStatus,
        toStatus: nextStatus,
        error: `غير مسموح بالانتقال من حالة الاشتراك [${currentStatus}] إلى [${nextStatus}]. الانتقالات المسموحة: [${allowed.join(', ')}]`
      };
    }

    // Determine recommended payment status based on target lifecycle status
    let recommendedPaymentStatus: SubscriptionPaymentStatus | undefined;
    switch (nextStatus) {
      case 'ACTIVE':
        recommendedPaymentStatus = 'PAID';
        break;
      case 'PENDING_PAYMENT':
        recommendedPaymentStatus = 'PENDING';
        break;
      case 'PAYMENT_FAILED':
        recommendedPaymentStatus = 'FAILED';
        break;
      case 'GRACE_PERIOD':
        recommendedPaymentStatus = 'GRACE';
        break;
      case 'CANCELLED':
      case 'EXPIRED':
        // Keep current or mark pending/unpaid
        break;
    }

    return {
      valid: true,
      fromStatus: currentStatus,
      toStatus: nextStatus,
      recommendedPaymentStatus
    };
  }

  /**
   * Checks whether the subscription state allows active feature usage
   * (Active, Renewal Due, Grace Period, or Scheduled change states maintain access)
   */
  public static canAccessFullFeatures(status: SubscriptionLifecycleStatus): boolean {
    return [
      'ACTIVE',
      'RENEWAL_DUE',
      'GRACE_PERIOD',
      'UPGRADE_SCHEDULED',
      'DOWNGRADE_SCHEDULED'
    ].includes(status);
  }

  /**
   * Checks if subscription is currently in a grace period
   */
  public static isGracePeriod(status: SubscriptionLifecycleStatus): boolean {
    return status === 'GRACE_PERIOD';
  }

  /**
   * Checks if subscription is terminated or expired
   */
  public static isExpiredOrCancelled(status: SubscriptionLifecycleStatus): boolean {
    return ['EXPIRED', 'CANCELLED'].includes(status);
  }

  /**
   * Maps modern lifecycle status to legacy 3-value status for backward compatibility
   */
  public static mapToLegacyStatus(status: SubscriptionLifecycleStatus): 'active' | 'expired' | 'suspended' {
    switch (status) {
      case 'ACTIVE':
      case 'RENEWAL_DUE':
      case 'GRACE_PERIOD':
      case 'UPGRADE_SCHEDULED':
      case 'DOWNGRADE_SCHEDULED':
      case 'PENDING_PAYMENT':
      case 'DRAFT':
        return 'active';
      case 'SUSPENDED':
        return 'suspended';
      case 'EXPIRED':
      case 'CANCELLED':
      case 'PAYMENT_FAILED':
      default:
        return 'expired';
    }
  }

  /**
   * Maps legacy status string to modern lifecycle status
   */
  public static mapFromLegacyStatus(legacyStatus: string): SubscriptionLifecycleStatus {
    const norm = (legacyStatus || '').toLowerCase();
    if (norm === 'active') return 'ACTIVE';
    if (norm === 'suspended') return 'SUSPENDED';
    if (norm === 'expired') return 'EXPIRED';
    return 'ACTIVE';
  }
}
