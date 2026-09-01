/**
 * @file SettlementStateMachine.ts
 * @description محرك إدارة حالات التسوية المالية للمزودين (P0 Settlement State Machine).
 * يمثل استحقاق المزود (Settlement) ويفصله عن أمر الصرف والتحويل الفعلي (Payout).
 */

import { SettlementInstruction, PayoutInstruction } from '../../models/Database.js';

export type SettlementState =
  | 'draft'
  | 'pending_eligibility'
  | 'eligible'
  | 'scheduled'
  | 'release_requested'
  | 'processing'
  | 'paid'
  | 'on_hold'
  | 'failed'
  | 'cancelled'
  | 'reversed'
  | 'partially_reversed'
  | 'reconciliation_required'
  | 'manual_review';

export interface SettlementTransitionContext {
  actor: string;
  reason?: string;
  payoutId?: string;
  failureCode?: string;
  metadata?: any;
}

export class SettlementStateMachine {
  private static readonly VALID_TRANSITIONS: Record<SettlementState, SettlementState[]> = {
    'draft': ['pending_eligibility', 'cancelled', 'on_hold'],
    'pending_eligibility': ['eligible', 'scheduled', 'on_hold', 'cancelled'],
    'eligible': ['scheduled', 'release_requested', 'on_hold', 'cancelled'],
    'scheduled': ['release_requested', 'processing', 'on_hold', 'cancelled'],
    'release_requested': ['processing', 'on_hold', 'cancelled', 'manual_review'],
    'processing': ['paid', 'failed', 'on_hold', 'reconciliation_required', 'manual_review'],
    'paid': ['reversed', 'partially_reversed', 'manual_review'],
    'on_hold': ['pending_eligibility', 'eligible', 'scheduled', 'release_requested', 'cancelled', 'manual_review'],
    'failed': ['scheduled', 'release_requested', 'on_hold', 'cancelled'],
    'cancelled': [],
    'reversed': ['manual_review'],
    'partially_reversed': ['manual_review'],
    'reconciliation_required': ['processing', 'paid', 'manual_review', 'on_hold'],
    'manual_review': ['eligible', 'scheduled', 'release_requested', 'processing', 'cancelled', 'on_hold']
  };

  static canTransition(from: SettlementState, to: SettlementState): boolean {
    const allowed = this.VALID_TRANSITIONS[from] || [];
    return allowed.includes(to);
  }

  static async transition(
    settlement: SettlementInstruction,
    targetState: SettlementState,
    context: SettlementTransitionContext,
    options?: { transaction?: any }
  ): Promise<SettlementInstruction> {
    const currentState = settlement.status as SettlementState;

    if (currentState === targetState) {
      return settlement;
    }

    if (!this.canTransition(currentState, targetState)) {
      throw new Error(
        `🚨 Settlement State Violation: Cannot transition Settlement #${settlement.instructionNo} from '${currentState}' to '${targetState}'. Allowed transitions: ${(this.VALID_TRANSITIONS[currentState] || []).join(', ')}`
      );
    }

    // 🔒 SETTLEMENT INVARIANT: Settlement cannot be marked 'paid' directly without verified PAID Payout!
    if (targetState === 'paid') {
      const payoutId = settlement.payoutId || context.payoutId;
      if (!payoutId) {
        throw new Error(
          `🚨 Settlement Invariant Violation: Cannot mark Settlement #${settlement.instructionNo} as 'paid' without an associated Payout Instruction!`
        );
      }

      const payout = await PayoutInstruction.findByPk(payoutId, { transaction: options?.transaction });
      if (!payout || payout.status !== 'paid') {
        throw new Error(
          `🚨 Settlement Invariant Violation: Cannot mark Settlement #${settlement.instructionNo} as 'paid' because linked Payout #${payout?.payoutNo || payoutId} is not in 'paid' state (current: ${payout?.status || 'NOT_FOUND'})!`
        );
      }
      settlement.paidAt = new Date();
    }

    if (targetState === 'release_requested') {
      settlement.releasedAt = new Date();
    } else if (targetState === 'on_hold') {
      settlement.holdReason = context.reason || 'تعليق إداري أو مالي مؤقت';
    } else if (targetState === 'failed') {
      settlement.failureCode = context.failureCode || 'SETTLEMENT_FAILED';
    }

    settlement.status = targetState;
    settlement.version += 1;
    await settlement.save({ transaction: options?.transaction });

    return settlement;
  }
}
