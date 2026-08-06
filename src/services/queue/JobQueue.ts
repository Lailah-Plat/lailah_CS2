import { Logger } from "../logger.service.js";

export interface Job<TPayload = any> {
  id: string;
  type: string;
  payload: TPayload;
  status: "queued" | "processing" | "completed" | "failed";
  attempts: number;
  maxAttempts: number;
  error?: string;
  createdAt: Date;
  processedAt?: Date;
}

export type JobHandler<TPayload = any> = (payload: TPayload) => Promise<boolean | void>;

export class JobQueue {
  private static jobs: Map<string, Job> = new Map();
  private static handlers: Map<string, JobHandler> = new Map();
  private static isProcessing = false;
  private static concurrencyLimit = 3;
  private static activeCount = 0;

  /**
   * Registers a callback handler for a specific job type.
   */
  static registerHandler<T = any>(type: string, handler: JobHandler<T>) {
    this.handlers.set(type.toLowerCase(), handler);
    Logger.info(`[JobQueue] Registered handler for job type: ${type}`);
  }

  /**
   * Enqueues a new background job.
   */
  static addJob<T = any>(type: string, payload: T, options?: { maxAttempts?: number }): string {
    const id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const job: Job<T> = {
      id,
      type: type.toLowerCase(),
      payload,
      status: "queued",
      attempts: 0,
      maxAttempts: options?.maxAttempts ?? 3,
      createdAt: new Date(),
    };

    this.jobs.set(id, job);
    Logger.info(`[JobQueue] Job Enqueued: ${type} (ID: ${id})`);

    // Non-blocking trigger to process queue
    this.triggerProcessing();

    return id;
  }

  /**
   * Safely triggers background loop without blocking execution flow.
   */
  private static triggerProcessing() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    
    // Defer execution using setImmediate or setTimeout to completely free the current call stack
    setTimeout(() => this.processNext(), 0);
  }

  private static async processNext() {
    const queuedJobs = Array.from(this.jobs.values()).filter((j) => j.status === "queued");

    if (queuedJobs.length === 0 && this.activeCount === 0) {
      this.isProcessing = false;
      return;
    }

    while (this.activeCount < this.concurrencyLimit && queuedJobs.length > 0) {
      const job = queuedJobs.shift();
      if (!job) break;

      this.activeCount++;
      job.status = "processing";
      job.attempts++;
      job.processedAt = new Date();

      this.runJob(job).finally(() => {
        this.activeCount--;
        this.processNext();
      });
    }

    if (this.activeCount === 0 && queuedJobs.length === 0) {
      this.isProcessing = false;
    }
  }

  private static async runJob(job: Job) {
    const handler = this.handlers.get(job.type);
    if (!handler) {
      const errMsg = `No handler registered for job type: ${job.type}`;
      Logger.error(`[JobQueue] Failed job ${job.id}: ${errMsg}`);
      job.status = "failed";
      job.error = errMsg;
      return;
    }

    try {
      Logger.debug(`[JobQueue] Running job ${job.id} (Attempt ${job.attempts}/${job.maxAttempts})`);
      await handler(job.payload);
      
      job.status = "completed";
      Logger.info(`[JobQueue] Job completed successfully: ${job.id}`);
    } catch (err: any) {
      Logger.warn(`[JobQueue] Attempt ${job.attempts} failed for job ${job.id}: ${err.message || err}`);
      
      if (job.attempts < job.maxAttempts) {
        job.status = "queued"; // Re-queue
      } else {
        job.status = "failed";
        job.error = err.message || JSON.stringify(err);
        Logger.error(`[JobQueue] Job permanently failed: ${job.id}`, err);
      }
    }
  }

  /**
   * Returns current status details of a specific job.
   */
  static getJobStatus(id: string): Job | undefined {
    return this.jobs.get(id);
  }
}
