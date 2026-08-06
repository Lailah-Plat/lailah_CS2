/**
 * Transactional Outbox & Inbox Queueing Service with Idempotency Support
 * Implements SRE-grade event queueing and duplicate message elimination
 */

export interface OutboxEvent {
  id: string;
  eventType: string;
  eventVersion: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, any>;
  idempotencyKey: string;
  correlationId: string;
  status: 'PENDING' | 'PROCESSED' | 'FAILED' | 'DEAD_LETTER';
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  processedAt?: string;
  lastError?: string;
}

export interface InboxMessage {
  id: string;
  idempotencyKey: string;
  consumerName: string;
  payload: Record<string, any>;
  receivedAt: string;
  status: 'PROCESSED' | 'DUPLICATE_SKIPPED';
}

const STORAGE_OUTBOX_KEY = 'LAILAH_TRANSACTIONAL_OUTBOX_QUEUE';
const STORAGE_INBOX_KEY = 'LAILAH_TRANSACTIONAL_INBOX_LOG';

export class OutboxInboxService {
  /**
   * Reads existing outbox queue from local storage
   */
  public static getOutboxEvents(): OutboxEvent[] {
    try {
      const data = localStorage.getItem(STORAGE_OUTBOX_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to parse Outbox events from storage:', e);
    }
    return this.getInitialSeedEvents();
  }

  /**
   * Saves outbox events list to local storage
   */
  public static saveOutboxEvents(events: OutboxEvent[]): void {
    try {
      localStorage.setItem(STORAGE_OUTBOX_KEY, JSON.stringify(events));
      window.dispatchEvent(new Event('outbox_updated'));
    } catch (e) {
      console.error('Error saving Outbox events:', e);
    }
  }

  /**
   * Records a new domain/integration event to the Outbox queue with Idempotency Key
   */
  public static recordEvent(
    eventType: string,
    aggregateType: string,
    aggregateId: string,
    payload: Record<string, any>,
    idempotencyKey?: string,
    correlationId?: string
  ): OutboxEvent {
    const events = this.getOutboxEvents();
    const finalIdempotencyKey = idempotencyKey || `IK-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const finalCorrelationId = correlationId || `CR-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

    // Check idempotency conflict
    const existing = events.find(e => e.idempotencyKey === finalIdempotencyKey);
    if (existing) {
      console.info(`[Outbox] Duplicate event blocked by Idempotency Key: ${finalIdempotencyKey}`);
      return existing;
    }

    const newEvent: OutboxEvent = {
      id: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      eventType,
      eventVersion: '1.0',
      aggregateType,
      aggregateId,
      payload,
      idempotencyKey: finalIdempotencyKey,
      correlationId: finalCorrelationId,
      status: 'PENDING',
      retryCount: 0,
      maxRetries: 5,
      createdAt: new Date().toISOString()
    };

    events.unshift(newEvent);
    this.saveOutboxEvents(events);
    return newEvent;
  }

  /**
   * Simulates background dispatching of pending outbox events to subscribers/external services
   */
  public static processPendingOutbox(): { processedCount: number; failedCount: number } {
    const events = this.getOutboxEvents();
    let processedCount = 0;
    let failedCount = 0;

    const updated = events.map(evt => {
      if (evt.status === 'PENDING') {
        // Simulate processing outcome
        const isSuccess = Math.random() > 0.05; // 95% success rate
        if (isSuccess) {
          processedCount++;
          return {
            ...evt,
            status: 'PROCESSED' as const,
            processedAt: new Date().toISOString()
          };
        } else {
          failedCount++;
          const newRetryCount = evt.retryCount + 1;
          const isDeadLetter = newRetryCount >= evt.maxRetries;
          return {
            ...evt,
            retryCount: newRetryCount,
            status: isDeadLetter ? ('DEAD_LETTER' as const) : ('FAILED' as const),
            lastError: 'Network gateway timeout during background dispatch'
          };
        }
      }
      return evt;
    });

    this.saveOutboxEvents(updated);
    return { processedCount, failedCount };
  }

  /**
   * Replays a failed or dead-letter event safely using its Idempotency Key
   */
  public static replayEvent(eventId: string): boolean {
    const events = this.getOutboxEvents();
    const target = events.find(e => e.id === eventId);
    if (!target) return false;

    target.status = 'PENDING';
    target.retryCount = 0;
    target.lastError = undefined;

    this.saveOutboxEvents(events);
    this.processPendingOutbox();
    return true;
  }

  /**
   * Initial seed events for demonstration and testing in SRE dashboard
   */
  private static getInitialSeedEvents(): OutboxEvent[] {
    const now = new Date();
    return [
      {
        id: 'EVT-20260727-001',
        eventType: 'BookingConfirmed',
        eventVersion: '1.0',
        aggregateType: 'Booking',
        aggregateId: 'BKG-26-0000000001',
        payload: { bookingId: 'BKG-26-0000000001', amount: 12500, customerId: 'CUST-881' },
        idempotencyKey: 'IK-PAY-BKG-26-0000000001',
        correlationId: 'CR-99201-8812',
        status: 'PROCESSED',
        retryCount: 0,
        maxRetries: 5,
        createdAt: new Date(now.getTime() - 1000 * 60 * 45).toISOString(),
        processedAt: new Date(now.getTime() - 1000 * 60 * 44).toISOString()
      },
      {
        id: 'EVT-20260727-002',
        eventType: 'PaymentCaptured',
        eventVersion: '1.0',
        aggregateType: 'Payment',
        aggregateId: 'INV-260000000001',
        payload: { transactionId: 'TXN-881299', gateway: 'MadaPay', amountSar: 12500 },
        idempotencyKey: 'IK-MADA-TXN-881299',
        correlationId: 'CR-99201-8812',
        status: 'PROCESSED',
        retryCount: 0,
        maxRetries: 5,
        createdAt: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
        processedAt: new Date(now.getTime() - 1000 * 60 * 29).toISOString()
      },
      {
        id: 'EVT-20260727-003',
        eventType: 'LedgerJournalPosted',
        eventVersion: '1.0',
        aggregateType: 'FinanceLedger',
        aggregateId: 'REV-26-0000000001',
        payload: { journalId: 'JRN-2026-011', debitAccount: '1010-GATEWAY', creditAccount: '2010-PROVIDER-PAYABLE' },
        idempotencyKey: 'IK-LEDGER-REV-26-0000000001',
        correlationId: 'CR-99201-8812',
        status: 'PROCESSED',
        retryCount: 0,
        maxRetries: 5,
        createdAt: new Date(now.getTime() - 1000 * 60 * 15).toISOString(),
        processedAt: new Date(now.getTime() - 1000 * 60 * 14).toISOString()
      },
      {
        id: 'EVT-20260727-004',
        eventType: 'NafathVerificationRequested',
        eventVersion: '1.0',
        aggregateType: 'Verification',
        aggregateId: 'VER-PROV-901',
        payload: { nationalId: '109****123', providerId: 'PROV-102', action: 'CR_AUTHENTICATION' },
        idempotencyKey: 'IK-NAFATH-VER-PROV-901',
        correlationId: 'CR-77182-1029',
        status: 'PENDING',
        retryCount: 0,
        maxRetries: 5,
        createdAt: new Date(now.getTime() - 1000 * 60 * 2).toISOString()
      }
    ];
  }
}
