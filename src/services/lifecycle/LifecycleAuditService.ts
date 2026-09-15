/**
 * Lifecycle Event & Audit Logging Service (P2.1)
 * Records append-only domain events and state transition audit logs for compliance & timeline tracking.
 */

import { DomainEvent, LifecycleAuditLog } from '../../models/Database.js';

export interface RecordTransitionLogParams {
  aggregateType: 'Booking' | 'SupportServiceRequest' | string;
  aggregateId: number | string;
  fromState: string;
  toState: string;
  action: string;
  actorId?: number | null;
  actorRole?: string | null;
  reason?: string | null;
  metadata?: Record<string, any>;
}

export interface PublishDomainEventParams {
  eventType: string;
  aggregateType: 'Booking' | 'SupportServiceRequest' | 'Invoice' | 'Payment' | 'Settlement' | string;
  aggregateId: number | string;
  payload?: Record<string, any>;
  actorId?: number | null;
  actorRole?: string | null;
  stateSnapshot?: Record<string, any>;
}

export class LifecycleAuditService {
  /**
   * Records a state transition in the immutable audit log table.
   */
  public static async recordTransition(params: RecordTransitionLogParams): Promise<void> {
    try {
      await LifecycleAuditLog.create({
        aggregateType: params.aggregateType,
        aggregateId: String(params.aggregateId),
        fromState: params.fromState,
        toState: params.toState,
        action: params.action,
        actorId: params.actorId || null,
        actorRole: params.actorRole || 'system',
        reason: params.reason || null,
        metadata: JSON.stringify(params.metadata || {}),
        timestamp: new Date()
      });
    } catch (err: any) {
      console.warn(`[LifecycleAuditService] Failed to record transition audit log: ${err.message}`);
    }
  }

  /**
   * Publishes an immutable domain event.
   */
  public static async publishDomainEvent(params: PublishDomainEventParams): Promise<void> {
    try {
      const eventId = `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      await DomainEvent.create({
        eventId,
        eventType: params.eventType,
        aggregateType: params.aggregateType,
        aggregateId: String(params.aggregateId),
        payload: JSON.stringify(params.payload || {}),
        actorId: params.actorId || null,
        actorRole: params.actorRole || 'system',
        stateSnapshot: params.stateSnapshot ? JSON.stringify(params.stateSnapshot) : null
      });
    } catch (err: any) {
      console.warn(`[LifecycleAuditService] Failed to publish domain event: ${err.message}`);
    }
  }
}
