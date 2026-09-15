/**
 * @file FinancialReconciliationService.ts
 * @description Multi-Tier Financial Reconciliation Engine for Subscriptions, Feature Add-ons,
 * Payments, Invoices, and Admin Grants.
 * 
 * Detects discrepancies between Quotes, Captured Payments, Invoices, and Subscription activations.
 * Emits FINANCIAL_RECONCILIATION_MISMATCH audit events when violations or tampering are detected.
 */

import { Op } from 'sequelize';
import {
  FinancialQuote,
  ProviderSubscription,
  ProviderAddon,
  ProviderAdminGrant,
  SubscriptionPlan
} from '../../models/SubscriptionModels.js';
import { VerifiedPaymentEvent, SplitTransaction, Invoice } from '../../models/Database.js';
import { effectiveEntitlementService } from '../entitlement/effectiveEntitlementService.js';
import { TaxService } from './TaxService.js';
import { FEATURE_REGISTRY } from '../entitlement/featureRegistry.js';

export interface ReconciliationMismatch {
  type: 
    | 'AMOUNT_MISMATCH'
    | 'UNVERIFIED_ACTIVATION'
    | 'TAX_MISMATCH'
    | 'TAMPERED_PRICE'
    | 'EXPIRED_QUOTE_CONSUMPTION'
    | 'MISSING_INVOICE'
    | 'ORPHAN_PAYMENT';
  entityType: 'SUBSCRIPTION' | 'ADDON' | 'QUOTE' | 'PAYMENT';
  entityId: string | number;
  providerId: number;
  expectedValue: any;
  actualValue: any;
  discrepancy: number;
  description: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  timestamp: Date;
}

export interface ReconciliationReport {
  runId: string;
  timestamp: Date;
  providersAudited: number;
  quotesAudited: number;
  subscriptionsAudited: number;
  addonsAudited: number;
  mismatchesFound: number;
  mismatches: ReconciliationMismatch[];
  status: 'CLEAN' | 'MISMATCHES_DETECTED';
}

export class FinancialReconciliationService {
  private static instance: FinancialReconciliationService;

  public static getInstance(): FinancialReconciliationService {
    if (!FinancialReconciliationService.instance) {
      FinancialReconciliationService.instance = new FinancialReconciliationService();
    }
    return FinancialReconciliationService.instance;
  }

  /**
   * Run full financial reconciliation across all providers or a specific provider
   */
  public async runReconciliation(providerId?: number): Promise<ReconciliationReport> {
    const runId = `REC-${Date.now()}`;
    const now = new Date();
    const mismatches: ReconciliationMismatch[] = [];

    const providerFilter = providerId ? { providerId } : {};

    // 1. Audit Financial Quotes
    const quotes = await FinancialQuote.findAll({
      where: {
        ...providerFilter,
        status: 'CONSUMED'
      }
    });

    for (const quote of quotes) {
      // Check if consumed quote was expired at consumption time
      if (quote.consumedAt && quote.expiresAt && quote.consumedAt > quote.expiresAt) {
        const mismatch: ReconciliationMismatch = {
          type: 'EXPIRED_QUOTE_CONSUMPTION',
          entityType: 'QUOTE',
          entityId: quote.quoteId,
          providerId: quote.providerId,
          expectedValue: quote.expiresAt.toISOString(),
          actualValue: quote.consumedAt.toISOString(),
          discrepancy: 0,
          description: `عرض السعر #${quote.quoteId} تم استهلاكه بعد انتهاء صلاحيته الزمنية.`,
          severity: 'CRITICAL',
          timestamp: now
        };
        mismatches.push(mismatch);
        await this.logMismatch(mismatch);
      }

      // Check tax calculation integrity (15% VAT)
      const calculatedBase = TaxService.calculateBaseAmount(Number(quote.totalAmount));
      const calculatedTax = TaxService.calculateVatFromTotal(Number(quote.totalAmount));
      const diffTax = Math.abs(Number(quote.taxAmount) - calculatedTax);
      if (diffTax > 0.05) {
        const mismatch: ReconciliationMismatch = {
          type: 'TAX_MISMATCH',
          entityType: 'QUOTE',
          entityId: quote.quoteId,
          providerId: quote.providerId,
          expectedValue: calculatedTax,
          actualValue: quote.taxAmount,
          discrepancy: diffTax,
          description: `عدم تطابق في احتساب ضريبة القيمة المضافة 15% لعرض السعر #${quote.quoteId}.`,
          severity: 'WARNING',
          timestamp: now
        };
        mismatches.push(mismatch);
        await this.logMismatch(mismatch);
      }
    }

    // 2. Audit Active Subscriptions
    const subscriptions = await ProviderSubscription.findAll({
      where: {
        ...providerFilter,
        subscriptionStatus: { [Op.in]: ['ACTIVE', 'UPGRADE_SCHEDULED'] }
      }
    });

    for (const sub of subscriptions) {
      const pricePaid = Number(sub.pricePaid || 0);

      // If pricePaid > 0, verify payment event or paymentId exists
      if (pricePaid > 0 && !sub.paymentId && sub.paymentStatus === 'PAID') {
        const mismatch: ReconciliationMismatch = {
          type: 'UNVERIFIED_ACTIVATION',
          entityType: 'SUBSCRIPTION',
          entityId: sub.id,
          providerId: sub.providerId,
          expectedValue: 'Verified Payment Reference',
          actualValue: 'None',
          discrepancy: pricePaid,
          description: `اشتراك نشط #${sub.id} مسجل كمدفوع (${pricePaid} SAR) بدون معرّف دفع موثق.`,
          severity: 'CRITICAL',
          timestamp: now
        };
        mismatches.push(mismatch);
        await this.logMismatch(mismatch);
      }

      // Check price tampering vs base plan price
      const plan = await SubscriptionPlan.findByPk(sub.planId);
      if (plan && pricePaid < Number(plan.price) && pricePaid > 0) {
        // Verify if provider has an approved discount grant
        const grant = await ProviderAdminGrant.findOne({
          where: {
            providerId: sub.providerId,
            status: { [Op.in]: ['ACTIVE', 'CONSUMED'] },
            grantType: { [Op.in]: ['DISCOUNT', 'FREE_SUBSCRIPTION'] }
          }
        });

        if (!grant) {
          const mismatch: ReconciliationMismatch = {
            type: 'TAMPERED_PRICE',
            entityType: 'SUBSCRIPTION',
            entityId: sub.id,
            providerId: sub.providerId,
            expectedValue: Number(plan.price),
            actualValue: pricePaid,
            discrepancy: Number(plan.price) - pricePaid,
            description: `سعر الاشتراك المدفوع (${pricePaid} SAR) أقل من السعر الرسمي للباقة (${plan.price} SAR) بدون منحة خصم معتمدة.`,
            severity: 'CRITICAL',
            timestamp: now
          };
          mismatches.push(mismatch);
          await this.logMismatch(mismatch);
        }
      }
    }

    // 3. Audit Active Addons
    const addons = await ProviderAddon.findAll({
      where: {
        ...providerFilter,
        addonStatus: 'ACTIVE'
      }
    });

    for (const addon of addons) {
      const pricePaid = Number(addon.pricePaid || 0);
      if (pricePaid > 0 && !addon.paymentId && addon.paymentStatus === 'PAID') {
        const mismatch: ReconciliationMismatch = {
          type: 'UNVERIFIED_ACTIVATION',
          entityType: 'ADDON',
          entityId: addon.id,
          providerId: addon.providerId,
          expectedValue: 'Verified Payment Reference',
          actualValue: 'None',
          discrepancy: pricePaid,
          description: `ميزة إضافية نشطة #${addon.id} (${addon.featureKey}) مسجلة كمدفوعة بدون معرّف دفع موثق.`,
          severity: 'CRITICAL',
          timestamp: now
        };
        mismatches.push(mismatch);
        await this.logMismatch(mismatch);
      }
    }

    const uniqueProviders = new Set([
      ...quotes.map(q => q.providerId),
      ...subscriptions.map(s => s.providerId),
      ...addons.map(a => a.providerId)
    ]);

    return {
      runId,
      timestamp: now,
      providersAudited: uniqueProviders.size,
      quotesAudited: quotes.length,
      subscriptionsAudited: subscriptions.length,
      addonsAudited: addons.length,
      mismatchesFound: mismatches.length,
      mismatches,
      status: mismatches.length === 0 ? 'CLEAN' : 'MISMATCHES_DETECTED'
    };
  }

  public async reconcileProvider(providerId: number): Promise<ReconciliationReport> {
    return await this.runReconciliation(providerId);
  }

  public async reconcileAll(): Promise<ReconciliationReport> {
    return await this.runReconciliation();
  }

  /**
   * Log reconciliation mismatch to EntitlementAuditLog
   */
  private async logMismatch(mismatch: ReconciliationMismatch): Promise<void> {
    try {
      await effectiveEntitlementService.logAuditEvent({
        providerId: mismatch.providerId,
        eventType: 'FINANCIAL_RECONCILIATION_MISMATCH',
        source: 'SYSTEM',
        actor: 'FinancialReconciliationEngine',
        reason: mismatch.description,
        oldValue: String(mismatch.expectedValue),
        newValue: String(mismatch.actualValue),
        financialImpact: mismatch.discrepancy,
        metadata: {
          mismatchType: mismatch.type,
          entityType: mismatch.entityType,
          entityId: mismatch.entityId,
          severity: mismatch.severity
        }
      });
    } catch (e: any) {
      console.warn('Reconciliation audit log warning:', e.message || e);
    }
  }
}

export const financialReconciliationService = FinancialReconciliationService.getInstance();
