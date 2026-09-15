/**
 * @file addonStateMachine.ts
 * @description State Machine and Lifecycle Transition Engine for Feature Marketplace Add-ons.
 * 
 * Defines allowable states, transition validations, grace periods, and feature gating.
 * 
 * STRICT RULE: Feature activation cannot occur without verified payment.
 */

import { AddonLifecycleStatus } from '../../models/SubscriptionModels.js';

export class AddonStateMachine {
  /**
   * Allowed state transitions for Feature Marketplace Addons
   */
  private static readonly ALLOWED_TRANSITIONS: Record<AddonLifecycleStatus, AddonLifecycleStatus[]> = {
    DRAFT: [
      'PENDING_PAYMENT',
      'PAYMENT_PROCESSING',
      'ACTIVE',
      'CANCELLED'
    ],
    PENDING_PAYMENT: [
      'PAYMENT_PROCESSING',
      'ACTIVE',
      'PAYMENT_FAILED',
      'CANCELLED'
    ],
    PAYMENT_PROCESSING: [
      'ACTIVE',
      'PAYMENT_FAILED',
      'PENDING_PAYMENT',
      'CANCELLED'
    ],
    ACTIVE: [
      'RENEWAL_DUE',
      'GRACE_PERIOD',
      'EXPIRED',
      'CANCELLED',
      'SUSPENDED',
      'REFUNDED',
      'REVOKED'
    ],
    RENEWAL_DUE: [
      'ACTIVE',
      'GRACE_PERIOD',
      'PAYMENT_PROCESSING',
      'PAYMENT_FAILED',
      'EXPIRED',
      'CANCELLED'
    ],
    GRACE_PERIOD: [
      'ACTIVE',
      'PAYMENT_PROCESSING',
      'EXPIRED',
      'SUSPENDED',
      'CANCELLED',
      'PAYMENT_FAILED'
    ],
    EXPIRED: [
      'PENDING_PAYMENT',
      'PAYMENT_PROCESSING',
      'ACTIVE',
      'DRAFT'
    ],
    PAYMENT_FAILED: [
      'PENDING_PAYMENT',
      'PAYMENT_PROCESSING',
      'ACTIVE',
      'GRACE_PERIOD',
      'EXPIRED',
      'CANCELLED'
    ],
    SUSPENDED: [
      'ACTIVE',
      'CANCELLED',
      'EXPIRED',
      'REVOKED',
      'REFUNDED'
    ],
    REFUNDED: [
      'DRAFT',
      'PENDING_PAYMENT'
    ],
    REVOKED: [
      'DRAFT',
      'PENDING_PAYMENT'
    ],
    CANCELLED: [
      'DRAFT',
      'PENDING_PAYMENT'
    ]
  };

  /**
   * Check if transition from current to next is valid
   */
  static isValidTransition(current: AddonLifecycleStatus, next: AddonLifecycleStatus): boolean {
    if (current === next) return true;
    const allowed = this.ALLOWED_TRANSITIONS[current];
    return allowed ? allowed.includes(next) : false;
  }

  /**
   * Validate transition and return explanation if invalid
   */
  static validateTransition(current: AddonLifecycleStatus, next: AddonLifecycleStatus): { valid: boolean; reason?: string } {
    if (this.isValidTransition(current, next)) {
      return { valid: true };
    }
    return {
      valid: false,
      reason: `الانتقال غير مصرّح به في دورة حياة الميزة الإضافية من [${current}] إلى [${next}].`
    };
  }

  /**
   * Determine if the add-on grants active entitlement capabilities to the provider
   * ACTIVE, RENEWAL_DUE, and GRACE_PERIOD grant active features.
   */
  static hasActiveEntitlement(status: AddonLifecycleStatus): boolean {
    return status === 'ACTIVE' || status === 'RENEWAL_DUE' || status === 'GRACE_PERIOD';
  }

  /**
   * Check if status is a terminal / non-active state
   */
  static isTerminated(status: AddonLifecycleStatus): boolean {
    return status === 'EXPIRED' || status === 'CANCELLED' || status === 'REFUNDED' || status === 'REVOKED';
  }

  /**
   * Map modern status to legacy 3-state enum for backward compatibility
   */
  static mapToLegacyStatus(status: AddonLifecycleStatus): 'active' | 'expired' | 'cancelled' {
    switch (status) {
      case 'ACTIVE':
      case 'RENEWAL_DUE':
      case 'GRACE_PERIOD':
        return 'active';
      case 'EXPIRED':
      case 'SUSPENDED':
        return 'expired';
      case 'CANCELLED':
      case 'REFUNDED':
      case 'REVOKED':
      case 'PAYMENT_FAILED':
      case 'DRAFT':
      case 'PENDING_PAYMENT':
      case 'PAYMENT_PROCESSING':
        return 'cancelled';
      default:
        return 'active';
    }
  }
}
