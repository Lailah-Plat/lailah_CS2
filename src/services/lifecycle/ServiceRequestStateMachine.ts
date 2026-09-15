/**
 * Service Request Lifecycle State Machine (P2.1)
 * Enforces the 8 orthogonal state axes across the 4 approved policies for independent supporting services:
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
import { BookingState, PaymentState, BookingStateMachine, LifecycleAction, LifecycleTransitionMetadata } from './BookingStateMachine.js';
import { LifecycleAuditService } from './LifecycleAuditService.js';
import { regulatoryPeriodService } from '../bookingPolicy/regulatoryPeriodService.js';

export { BookingState as ServiceRequestState, PaymentState as ServicePaymentState };

export class ServiceRequestStateMachine {
  public static normalizeState(status: string | undefined | null): BookingLifecycleStatus {
    return BookingStateMachine.normalizeState(status);
  }

  public static normalizePaymentState(status: string | undefined | null): PaymentExecutionState {
    return BookingStateMachine.normalizePaymentState(status);
  }

  public static normalizePolicy(policy: string | undefined | null): BookingPaymentPolicy {
    return BookingStateMachine.normalizePolicy(policy);
  }

  public static isPaymentCheckoutAllowed(serviceRequest: {
    status?: string;
    lifecycleStatus?: string;
    providerDecision?: string;
    paymentState?: string;
    paymentStatus?: string;
    bookingPaymentPolicy?: string;
    paymentDeadline?: Date | string | null;
  }): { allowed: boolean; reason?: string } {
    return BookingStateMachine.isPaymentCheckoutAllowed(serviceRequest);
  }

  /**
   * Computes the initial 8 axes when a Support Service Request is first created
   */
  public static computeInitialAxes(params: {
    policy: BookingPaymentPolicy;
    isExternal?: boolean;
    hasPrePaid?: boolean;
    hasAuthorized?: boolean;
  }) {
    return BookingStateMachine.computeInitialAxes(params);
  }

  /**
   * Executes an atomic state transition on a SupportServiceRequest instance across all 8 axes
   */
  public static async transition(
    serviceRequest: any,
    action: LifecycleAction,
    metadata?: LifecycleTransitionMetadata
  ): Promise<any> {
    const now = new Date();
    const policy = this.normalizePolicy(serviceRequest.bookingPaymentPolicy);
    const fromState = serviceRequest.lifecycleStatus || serviceRequest.status || 'REQUESTED';

    const actorId = metadata?.actorId || null;
    const actorRole = metadata?.actorRole || 'system';

    switch (action) {
      case 'PROVIDER_ACCEPT': {
        serviceRequest.providerDecision = 'ACCEPTED';
        serviceRequest.acceptedAt = now;
        serviceRequest.acceptedBy = actorId;

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
          serviceRequest.paymentDeadline = new Date(now.getTime() + hours * 60 * 60 * 1000);
          serviceRequest.lifecycleStatus = 'PROVIDER_ACCEPTED';
          serviceRequest.status = 'PROVIDER_ACCEPTED';
          serviceRequest.paymentState = 'UNPAID';
        } else if (policy === 'PAYMENT_BEFORE_APPROVAL') {
          serviceRequest.lifecycleStatus = 'CONFIRMED';
          serviceRequest.status = 'confirmed';
          serviceRequest.paymentState = 'PAID';
          serviceRequest.paymentStatus = 'مدفوع';
        } else if (policy === 'AUTHORIZE_THEN_CAPTURE') {
          serviceRequest.lifecycleStatus = 'CONFIRMED';
          serviceRequest.status = 'confirmed';
          serviceRequest.paymentState = 'PAID';
          serviceRequest.paymentStatus = 'مدفوع';
          serviceRequest.paidAt = now;
        } else if (policy === 'INSTANT_CONFIRMATION') {
          serviceRequest.lifecycleStatus = 'CONFIRMED';
          serviceRequest.status = 'confirmed';
        }
        break;
      }

      case 'PROVIDER_REJECT': {
        serviceRequest.providerDecision = 'REJECTED';
        serviceRequest.rejectedAt = now;
        serviceRequest.rejectedBy = actorId;
        serviceRequest.rejectionReason = metadata?.rejectionReason || 'اعتذار مزود الخدمة عن تلبية الطلب';
        serviceRequest.lifecycleStatus = 'REJECTED';
        serviceRequest.status = 'rejected';

        if (serviceRequest.paymentState === 'PAID' || serviceRequest.paymentStatus === 'مدفوع') {
          serviceRequest.refundState = 'APPROVED';
          serviceRequest.refundReason = 'استرداد تلقائي لاعتذار المزود عن تلبية الخدمة';
        } else if (serviceRequest.paymentState === 'AUTHORIZED') {
          serviceRequest.paymentState = 'VOIDED';
        }
        break;
      }

      case 'PAYMENT_CAPTURED': {
        serviceRequest.paymentState = 'PAID';
        serviceRequest.paymentStatus = 'مدفوع';
        serviceRequest.paidAt = now;
        serviceRequest.paymentReference = metadata?.paymentReference || serviceRequest.paymentReference;
        serviceRequest.paymentMethod = metadata?.paymentMethod || serviceRequest.paymentMethod;

        if (policy === 'APPROVAL_BEFORE_PAYMENT' || policy === 'INSTANT_CONFIRMATION') {
          serviceRequest.lifecycleStatus = 'CONFIRMED';
          serviceRequest.status = 'confirmed';
        } else if (policy === 'PAYMENT_BEFORE_APPROVAL') {
          if (serviceRequest.providerDecision === 'ACCEPTED') {
            serviceRequest.lifecycleStatus = 'CONFIRMED';
            serviceRequest.status = 'confirmed';
          } else {
            serviceRequest.lifecycleStatus = 'AWAITING_PROVIDER';
            serviceRequest.status = 'pending';
          }
        }
        break;
      }

      case 'PAYMENT_AUTHORIZED': {
        serviceRequest.paymentState = 'AUTHORIZED';
        serviceRequest.paymentReference = metadata?.paymentReference || serviceRequest.paymentReference;
        serviceRequest.lifecycleStatus = 'AWAITING_PROVIDER';
        serviceRequest.status = 'pending';
        break;
      }

      case 'PROVIDER_TIMEOUT': {
        serviceRequest.providerDecision = 'TIMED_OUT';
        serviceRequest.lifecycleStatus = 'EXPIRED';
        serviceRequest.status = 'expired';
        serviceRequest.rejectionReason = 'انتهاء مهلة استجابة مزود الخدمة المحددة نظاماً دون اتخاذ قرار';

        if (serviceRequest.paymentState === 'PAID' || serviceRequest.paymentStatus === 'مدفوع') {
          serviceRequest.refundState = 'APPROVED';
          serviceRequest.refundReason = 'استرداد تلقائي لانتهاء مهلة رد مزود الخدمة';
        } else if (serviceRequest.paymentState === 'AUTHORIZED') {
          serviceRequest.paymentState = 'VOIDED';
        }
        break;
      }

      case 'PAYMENT_EXPIRED': {
        serviceRequest.lifecycleStatus = 'EXPIRED';
        serviceRequest.status = 'expired';
        serviceRequest.paymentState = 'VOIDED';
        serviceRequest.paymentStatus = 'UNPAID';
        serviceRequest.rejectionReason = 'انتهاء مهلة سداد طلب الخدمة الممنوحة للعميل بعد قبول المزود';
        break;
      }

      case 'START_EXECUTION': {
        serviceRequest.fulfillmentState = 'IN_PROGRESS';
        serviceRequest.lifecycleStatus = 'IN_EXECUTION';
        serviceRequest.status = 'IN_EXECUTION';
        break;
      }

      case 'COMPLETE_FULFILLMENT': {
        serviceRequest.fulfillmentState = 'DELIVERED';
        serviceRequest.lifecycleStatus = 'COMPLETED';
        serviceRequest.status = 'completed';
        serviceRequest.entitlementState = 'MATURED';
        break;
      }

      case 'RAISE_DISPUTE': {
        serviceRequest.disputeState = 'OPEN';
        serviceRequest.entitlementState = 'BLOCKED_DISPUTE';
        serviceRequest.disputeReason = metadata?.disputeReason || 'نزاع مفتوح على طلب الخدمة';
        break;
      }

      case 'RESOLVE_DISPUTE': {
        const resolution = metadata?.resolution || 'RESOLVED_CLIENT';
        serviceRequest.disputeState = resolution;
        if (resolution === 'RESOLVED_CLIENT') {
          serviceRequest.refundState = 'APPROVED';
          serviceRequest.entitlementState = 'FORFEITED';
        } else {
          serviceRequest.entitlementState = 'MATURED';
        }
        break;
      }

      case 'CANCEL': {
        serviceRequest.lifecycleStatus = 'CANCELLED';
        serviceRequest.status = 'cancelled';
        serviceRequest.cancelledAt = now;
        serviceRequest.cancelledBy = String(actorRole);
        serviceRequest.cancellationReason = metadata?.cancellationReason || 'إلغاء طلب الخدمة';

        if (serviceRequest.paymentState === 'AUTHORIZED') {
          serviceRequest.paymentState = 'VOIDED';
        } else if (serviceRequest.paymentState === 'PAID') {
          serviceRequest.refundState = 'REQUESTED';
        }
        break;
      }

      default:
        break;
    }

    if (typeof serviceRequest.save === 'function') {
      await serviceRequest.save();
    }

    const toState = serviceRequest.lifecycleStatus || serviceRequest.status;

    // Record Audit Log & Publish Domain Event
    await LifecycleAuditService.recordTransition({
      aggregateType: 'SupportServiceRequest',
      aggregateId: serviceRequest.id,
      fromState: String(fromState),
      toState: String(toState),
      action,
      actorId,
      actorRole,
      reason: metadata?.rejectionReason || metadata?.cancellationReason || null,
      metadata: {
        policy,
        providerDecision: serviceRequest.providerDecision,
        paymentState: serviceRequest.paymentState,
        refundState: serviceRequest.refundState,
        disputeState: serviceRequest.disputeState,
        fulfillmentState: serviceRequest.fulfillmentState,
        entitlementState: serviceRequest.entitlementState,
        settlementState: serviceRequest.settlementState
      }
    });

    await LifecycleAuditService.publishDomainEvent({
      eventType: `SERVICE_REQUEST_${action}`,
      aggregateType: 'SupportServiceRequest',
      aggregateId: serviceRequest.id,
      actorId,
      actorRole,
      payload: {
        action,
        policy,
        requestNumber: serviceRequest.requestNumber,
        serviceId: serviceRequest.serviceId,
        customerId: serviceRequest.customerId,
        providerId: serviceRequest.providerId
      },
      stateSnapshot: {
        lifecycleStatus: serviceRequest.lifecycleStatus,
        providerDecision: serviceRequest.providerDecision,
        paymentState: serviceRequest.paymentState,
        refundState: serviceRequest.refundState,
        disputeState: serviceRequest.disputeState,
        fulfillmentState: serviceRequest.fulfillmentState,
        entitlementState: serviceRequest.entitlementState,
        settlementState: serviceRequest.settlementState
      }
    });

    return serviceRequest;
  }
}
