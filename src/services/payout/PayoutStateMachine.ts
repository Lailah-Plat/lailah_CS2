/**
 * @file PayoutStateMachine.ts
 * @description محرك إدارة حالات أوامر الصرف المالي الخارجي (P0 Payout State Machine).
 * يفرض قواعد الانتقال القانونية ويمنع تحول أمر الصرف إلى PAID دون إثبات خارجي مؤكد ومطابقة محاسبية وتسجيل القيد في دفتر الأستاذ.
 */

import { PayoutInstruction } from '../../models/Database.js';

export type PayoutState = 
  | 'created'
  | 'validated'
  | 'queued'
  | 'submitted'
  | 'processing'
  | 'confirmed'
  | 'reconciled'
  | 'paid'
  | 'rejected'
  | 'failed'
  | 'returned'
  | 'cancelled'
  | 'retry_pending'
  | 'manual_review'
  | 'reconciliation_required';

export interface PayoutTransitionContext {
  actor: string;
  reason?: string;
  externalReference?: string;
  externalBatchId?: string;
  failureCode?: string;
  failureReason?: string;
  metadata?: any;
  externalConfirmationVerified?: boolean;
}

export class PayoutStateMachine {
  /**
   * مصفوفة الانتقالات الصالحة لحالات أمر الصرف
   */
  private static readonly VALID_TRANSITIONS: Record<PayoutState, PayoutState[]> = {
    'created': ['validated', 'cancelled', 'manual_review'],
    'validated': ['queued', 'cancelled', 'manual_review'],
    'queued': ['submitted', 'processing', 'cancelled', 'failed', 'manual_review'],
    'submitted': ['processing', 'confirmed', 'failed', 'rejected', 'manual_review'],
    'processing': ['confirmed', 'failed', 'returned', 'manual_review', 'reconciliation_required'],
    'confirmed': ['reconciled', 'reconciliation_required', 'failed', 'manual_review'],
    'reconciled': ['paid', 'reconciliation_required', 'manual_review'],
    'paid': ['returned'], // Paid can only transition to returned if bank reverses transfer
    'rejected': ['cancelled', 'manual_review', 'retry_pending'],
    'failed': ['retry_pending', 'cancelled', 'manual_review'],
    'returned': ['manual_review', 'cancelled', 'retry_pending'],
    'cancelled': [],
    'retry_pending': ['queued', 'cancelled', 'manual_review'],
    'manual_review': ['validated', 'queued', 'processing', 'confirmed', 'reconciled', 'cancelled', 'failed'],
    'reconciliation_required': ['reconciled', 'manual_review', 'failed']
  };

  /**
   * التحقق من إمكانية الانتقال بين حالتين
   */
  static canTransition(from: PayoutState, to: PayoutState): boolean {
    const allowed = this.VALID_TRANSITIONS[from] || [];
    return allowed.includes(to);
  }

  /**
   * تنفيذ الانتقال الصارم مع التحقق من الشروط غير القابلة للكسر (Invariants)
   */
  static async transition(
    payout: PayoutInstruction,
    targetState: PayoutState,
    context: PayoutTransitionContext,
    options?: { transaction?: any }
  ): Promise<PayoutInstruction> {
    const currentState = payout.status as PayoutState;

    if (currentState === targetState) {
      return payout;
    }

    if (!this.canTransition(currentState, targetState)) {
      throw new Error(
        `🚨 Payout State Violation: Cannot transition Payout #${payout.payoutNo} from '${currentState}' to '${targetState}'. Allowed transitions: ${(this.VALID_TRANSITIONS[currentState] || []).join(', ')}`
      );
    }

    // 🔒 GOLDEN INVARIANT CHECK FOR 'PAID'
    if (targetState === 'paid') {
      const isConfirmed = payout.confirmationStatus === 'confirmed' || context.externalConfirmationVerified;
      const isReconciled = payout.reconciliationStatus === 'matched';
      const isLedgerPosted = payout.ledgerPostingStatus === 'posted';

      if (!isConfirmed) {
        throw new Error(
          `🚨 Payout Settlement Invariant Violation: Cannot mark Payout #${payout.payoutNo} as 'paid' without verified external proof/confirmation!`
        );
      }
      if (!isReconciled) {
        throw new Error(
          `🚨 Payout Settlement Invariant Violation: Cannot mark Payout #${payout.payoutNo} as 'paid' without financial reconciliation MATCH!`
        );
      }
      if (!isLedgerPosted) {
        throw new Error(
          `🚨 Payout Settlement Invariant Violation: Cannot mark Payout #${payout.payoutNo} as 'paid' without double-entry ledger journal posting!`
        );
      }
      payout.paidAt = new Date();
    }

    // State specific updates
    if (targetState === 'submitted') {
      payout.submissionStatus = 'submitted';
      payout.submittedAt = new Date();
      if (context.externalReference) {
        payout.externalReference = context.externalReference;
      }
      if (context.externalBatchId) {
        payout.externalBatchId = context.externalBatchId;
      }
    } else if (targetState === 'processing') {
      payout.submissionStatus = 'accepted';
      if (context.externalReference && !payout.externalReference) {
        payout.externalReference = context.externalReference;
      }
    } else if (targetState === 'confirmed') {
      payout.confirmationStatus = 'confirmed';
      payout.confirmedAt = new Date();
    } else if (targetState === 'reconciled') {
      payout.reconciliationStatus = 'matched';
      payout.reconciledAt = new Date();
    } else if (targetState === 'failed') {
      payout.failureCode = context.failureCode || 'GATEWAY_ERROR';
      payout.failureReason = context.failureReason || context.reason || 'فشل التحويل من قبل البوابة أو البنك';
    } else if (targetState === 'returned') {
      payout.confirmationStatus = 'returned';
      payout.returnedAt = new Date();
      payout.failureReason = context.reason || 'إرجاع الحوالة من قبل بنك المستفيد';
    }

    // Append Audit Trail
    const auditEntries = Array.isArray(payout.auditTrail) ? [...payout.auditTrail] : [];
    auditEntries.push({
      timestamp: new Date().toISOString(),
      previousState: currentState,
      newState: targetState,
      actor: context.actor,
      reason: context.reason || '',
      externalReference: context.externalReference || payout.externalReference,
      metadata: context.metadata
    });
    payout.auditTrail = auditEntries;

    payout.status = targetState;
    await payout.save({ transaction: options?.transaction });

    return payout;
  }
}
