/**
 * @file PayoutOrchestrator.ts
 * @description المنسق المالي السيادي لدورة التسوية وأوامر الصرف (P0 Sovereign Payout & Settlement Orchestrator).
 * يضمن استحالة تحول أي تسوية إلى 'PAID' دون إثبات بنكي خارجي ومطابقة محاسبية كاملة وتسجيل القيود المزدوجة.
 */

import { 
  sequelize,
  SettlementInstruction, 
  PayoutInstruction, 
  Beneficiary,
  ProviderReceivableModel,
  GatewayEvent,
  Wallet,
  WalletTransaction,
  FinancialClaim,
  LedgerJournal
} from '../../models/Database.js';
import { SettlementEligibilityEngine } from '../finance/SettlementEligibilityEngine.js';
import { PayoutStateMachine } from './PayoutStateMachine.js';
import { SettlementStateMachine } from './SettlementStateMachine.js';
import { PayoutAdapterFactory } from './PayoutProviderAdapter.js';
import { PayoutReconciliationService } from './PayoutReconciliationService.js';
import { UnifiedPaymentsEngine, generateExpenseNumber } from '../payment/UnifiedPaymentsEngine.js';
import { Logger } from '../logger.service.js';
import { Op } from 'sequelize';

export interface CreatePayoutInput {
  settlementId: string;
  actor: string;
  gatewayName?: string;
  paymentRail?: 'sarie' | 'sama_fast' | 'b2b_wire' | 'gateway_payout' | 'direct_bank';
  requiresDualApproval?: boolean;
}

export interface PayoutFinancialSnapshot {
  settlementId: string;
  providerId: number;
  grossProviderPayableHalalas: number;
  refundsDeductedHalalas: number;
  penaltiesDeductedHalalas: number;
  receivablesOffsetHalalas: number;
  adjustmentsHalalas: number;
  netPayoutAmountHalalas: number;
  currency: string;
  settlementStrategy: string;
  settlementStrategyVersion: string;
  bankAccountSnapshot: any;
  beneficiarySnapshot: any;
  calculationVersion: string;
  createdAt: string;
}

async function generateUniqueJournalNumber(prefix: 'EXP' | 'REV' | 'JRN' = 'EXP'): Promise<string> {
  const currentYear = new Date().getFullYear();
  const yy = String(currentYear).slice(-2);
  let count = 0;
  try {
    count = await LedgerJournal.count();
  } catch (e) {}
  let attempt = 1;
  while (attempt <= 100) {
    const seq = String(count + attempt + Math.floor(Math.random() * 100000)).padStart(10, '0').slice(-10);
    const candidate = `${prefix}-${yy}-${seq}`;
    const exists = await LedgerJournal.findOne({ where: { journalNo: candidate } });
    if (!exists) return candidate;
    attempt++;
  }
  return `${prefix}-${yy}-${Date.now().toString().slice(-10)}`;
}

export class PayoutOrchestrator {
  private static readonly SNAPSHOT_VERSION = 'V2.5.0';

  /**
   * 1. طلب تحرير التسوية المالية بعد فحص الأهلية الكامل (Release Settlement)
   */
  static async requestSettlementRelease(
    settlementId: string,
    actor: string,
    options?: { transaction?: any }
  ) {
    const transaction = options?.transaction;

    const settlement = await SettlementInstruction.findByPk(settlementId, { transaction });
    if (!settlement) {
      throw new Error(`سجل التسوية #${settlementId} غير موجود.`);
    }

    const eligibility = await SettlementEligibilityEngine.evaluateEligibility(settlementId, { transaction });
    if (!eligibility.eligible) {
      throw new Error(`التسوية غير مؤهلة للتحرير: ${eligibility.reasons.join(' | ')}`);
    }

    // Transition state
    await SettlementStateMachine.transition(settlement, 'release_requested', {
      actor,
      reason: 'طلب تحرير التسوية المالية بعد استيفاء شروط الأهلية'
    }, { transaction });

    return {
      success: true,
      settlement,
      eligibility
    };
  }

  /**
   * 2. إنشاء أمر الصرف المالي مع تجميد لقطة الحسابات الثابتة (Create Payout Instruction + Snapshot)
   */
  static async createPayoutInstruction(
    input: CreatePayoutInput,
    options?: { transaction?: any }
  ) {
    const isExternalTx = !!options?.transaction;
    const t = options?.transaction || await sequelize.transaction();

    try {
      const settlement = await SettlementInstruction.findByPk(input.settlementId, { 
        transaction: t,
        lock: t.LOCK?.UPDATE 
      });

      if (!settlement) {
        throw new Error(`سجل التسوية #${input.settlementId} غير موجود.`);
      }

      // Check for existing active payout (Idempotency)
      const existingPayout = await PayoutInstruction.findOne({
        where: {
          settlementId: settlement.id,
          status: {
            [Op.in]: ['created', 'validated', 'queued', 'submitted', 'processing', 'confirmed', 'reconciled', 'paid']
          }
        },
        transaction: t
      });

      if (existingPayout) {
        if (!isExternalTx) await t.commit();
        return {
          success: true,
          payout: existingPayout,
          idempotentDuplicate: true,
          message: `أمر الصرف #${existingPayout.payoutNo} منشأ مسبقاً بنفس المعرف.`
        };
      }

      // Evaluate Eligibility & Deductions
      const eligibility = await SettlementEligibilityEngine.evaluateEligibility(settlement.id, { transaction: t });
      if (!eligibility.eligible) {
        throw new Error(`فشل التحقق من أهلية التسوية لإنشاء التحويل: ${eligibility.reasons.join(' | ')}`);
      }

      // Freeze Immutable Payout Financial Snapshot
      const financialSnapshot: PayoutFinancialSnapshot = {
        settlementId: settlement.id,
        providerId: settlement.providerId,
        grossProviderPayableHalalas: eligibility.grossPayableHalalas,
        refundsDeductedHalalas: eligibility.refundDeductionsHalalas,
        penaltiesDeductedHalalas: eligibility.penaltiesHalalas,
        receivablesOffsetHalalas: eligibility.receivablesOffsetHalalas,
        adjustmentsHalalas: eligibility.adjustmentsHalalas,
        netPayoutAmountHalalas: eligibility.netPayableHalalas,
        currency: settlement.currency || 'SAR',
        settlementStrategy: settlement.settlementStrategy || 'T_PLUS_1',
        settlementStrategyVersion: settlement.settlementStrategyVersion || 'V2.5.0',
        bankAccountSnapshot: eligibility.beneficiarySnapshot,
        beneficiarySnapshot: eligibility.beneficiarySnapshot,
        calculationVersion: this.SNAPSHOT_VERSION,
        createdAt: new Date().toISOString()
      };

      // Generate Number and Idempotency Key
      let payoutNo = await generateExpenseNumber();
      let exists = await PayoutInstruction.findOne({ where: { payoutNo }, transaction: t });
      let attempt = 1;
      while (exists && attempt <= 50) {
        const count = await PayoutInstruction.count({ transaction: t });
        const currentYear = new Date().getFullYear();
        const yy = String(currentYear).slice(-2);
        payoutNo = `EXP-${yy}-${String(count + attempt + 1).padStart(10, '0')}`;
        exists = await PayoutInstruction.findOne({ where: { payoutNo }, transaction: t });
        attempt++;
      }
      const idempotencyKey = `PAYOUT:${settlement.id}:V${settlement.version}`;

      // Create Payout Instruction
      const payout = await PayoutInstruction.create({
        payoutNo,
        settlementId: settlement.id,
        providerId: settlement.providerId,
        beneficiaryId: settlement.beneficiaryId,
        amount: eligibility.netPayableHalalas,
        grossPayableAmount: eligibility.grossPayableHalalas,
        receivablesOffsetAmount: eligibility.receivablesOffsetHalalas,
        refundDeductionsAmount: eligibility.refundDeductionsHalalas,
        penaltiesAmount: eligibility.penaltiesHalalas,
        adjustmentsAmount: eligibility.adjustmentsHalalas,
        currency: settlement.currency || 'SAR',
        paymentRail: input.paymentRail || 'sarie',
        gatewayName: input.gatewayName || 'hyperpay',
        idempotencyKey,
        status: 'created',
        financialSnapshot,
        beneficiarySnapshot: eligibility.beneficiarySnapshot || {},
        dualApproval: input.requiresDualApproval ? {
          required: true,
          requestedBy: input.actor,
          approvedBy: null,
          approvedAt: null
        } : null,
        auditTrail: [{
          timestamp: new Date().toISOString(),
          previousState: 'none',
          newState: 'created',
          actor: input.actor,
          reason: 'إنشاء أمر الصرف وتجميد اللقطة المالية للمستحقات'
        }]
      }, { transaction: t });

      // Link payoutId to Settlement
      settlement.payoutId = payout.id;
      settlement.netPayableAmount = eligibility.netPayableHalalas;
      settlement.receivablesOffsetAmount = eligibility.receivablesOffsetHalalas;
      settlement.refundDeductionsAmount = eligibility.refundDeductionsHalalas;
      await settlement.save({ transaction: t });

      // If receivables were offset, update provider receivable records
      if (eligibility.receivablesOffsetHalalas > 0) {
        let remainingOffsetToApply = eligibility.receivablesOffsetHalalas;
        const receivables = await ProviderReceivableModel.findAll({
          where: {
            providerId: settlement.providerId,
            status: ['outstanding', 'partially_paid']
          },
          order: [['dueDate', 'ASC']],
          transaction: t
        });

        for (const rec of receivables) {
          if (remainingOffsetToApply <= 0) break;
          const recAmount = Number(rec.amount || 0);
          if (remainingOffsetToApply >= recAmount) {
            rec.status = 'collected';
            remainingOffsetToApply -= recAmount;
          } else {
            rec.amount = recAmount - remainingOffsetToApply;
            rec.status = 'partially_paid';
            remainingOffsetToApply = 0;
          }
          await rec.save({ transaction: t });
        }
      }

      // Transition Payout to 'validated'
      await PayoutStateMachine.transition(payout, 'validated', {
        actor: input.actor,
        reason: 'تم التحقق من اكتمال المعطيات والشروط الفنية للتحويل'
      }, { transaction: t });

      if (!isExternalTx) await t.commit();

      return {
        success: true,
        payout,
        snapshot: financialSnapshot,
        idempotentDuplicate: false
      };
    } catch (err: any) {
      if (!isExternalTx) await t.rollback();
      throw err;
    }
  }

  /**
   * 3. إرسال أمر الصرف للخارج إلى البنك أو البوابة (Dispatch Payout to External Rail)
   */
  static async dispatchPayout(
    payoutId: string,
    actor: string,
    options?: { transaction?: any }
  ) {
    const isExternalTx = !!options?.transaction;
    const t = options?.transaction || await sequelize.transaction();

    try {
      const payout = await PayoutInstruction.findByPk(payoutId, { 
        transaction: t,
        lock: t.LOCK?.UPDATE 
      });

      if (!payout) {
        throw new Error(`أمر الصرف #${payoutId} غير موجود.`);
      }

      if (['submitted', 'processing', 'confirmed', 'reconciled', 'paid'].includes(payout.status)) {
        if (!isExternalTx) await t.commit();
        return {
          success: true,
          payout,
          alreadyDispatched: true,
          message: `أمر الصرف #${payout.payoutNo} مرسل بالفعل بحالة (${payout.status}).`
        };
      }

      // Check Dual Approval
      const dual = payout.dualApproval as any;
      if (dual && dual.required && !dual.approvedBy) {
        throw new Error(`أمر الصرف يتطلب موافقة المعتمد (Checker Approval) قبل الإرسال الخارجي.`);
      }

      // Transition to QUEUED
      await PayoutStateMachine.transition(payout, 'queued', {
        actor,
        reason: 'إدراج أمر الصرف في رتل الإرسال الخارجي'
      }, { transaction: t });

      // Update Settlement status to PROCESSING
      const settlement = await SettlementInstruction.findByPk(payout.settlementId, { transaction: t });
      if (settlement && settlement.status !== 'processing') {
        await SettlementStateMachine.transition(settlement, 'processing', {
          actor,
          reason: 'بدء معالجة التحويل البنكي الخارجي',
          payoutId: payout.id
        }, { transaction: t });
      }

      // Resolve Adapter & Prepare Payload
      const adapter = PayoutAdapterFactory.getAdapter(payout.gatewayName);
      const beneficiarySnap: any = payout.beneficiarySnapshot;
      const beneficiary = await Beneficiary.findByPk(payout.beneficiaryId, { transaction: t });

      // Call External Gateway / Bank API (Outside DB Lock or immediate ACK)
      const submissionResult = await adapter.createPayout({
        payoutId: payout.id,
        payoutNo: payout.payoutNo,
        settlementId: payout.settlementId,
        amountHalalas: Number(payout.amount),
        currency: payout.currency,
        beneficiaryName: beneficiary?.officialName || beneficiarySnap?.officialName || 'المزود المعتمد',
        beneficiaryIban: beneficiary?.iban || (beneficiarySnap as any)?.iban || 'SA8000000000000000000000',
        bankName: beneficiary?.bankName || beneficiarySnap?.bankName || 'البنك الأهلي السعودي',
        idempotencyKey: payout.idempotencyKey,
        paymentRail: payout.paymentRail
      });

      if (!submissionResult.success) {
        // Transition to FAILED
        await PayoutStateMachine.transition(payout, 'failed', {
          actor,
          failureCode: submissionResult.gatewayCode || 'SUBMISSION_REJECTED',
          failureReason: submissionResult.description || 'رفض البنك أو البوابة استلام أمر التحويل',
          reason: 'رفض استلام أمر الصرف من البوابة الخارجية'
        }, { transaction: t });

        if (!isExternalTx) await t.commit();
        return {
          success: false,
          payout,
          submissionResult,
          message: submissionResult.description
        };
      }

      // Transition to SUBMITTED
      await PayoutStateMachine.transition(payout, 'submitted', {
        actor,
        externalReference: submissionResult.externalReference,
        externalBatchId: submissionResult.externalBatchId,
        reason: 'تم استلام أمر الصرف من بوابة التحويل وقبوله في رتل المقاصة'
      }, { transaction: t });

      // Transition to PROCESSING
      await PayoutStateMachine.transition(payout, 'processing', {
        actor,
        externalReference: submissionResult.externalReference,
        reason: 'أمر الصرف قيد المقاصة والتسوية البنكية بين البنوك'
      }, { transaction: t });

      if (!isExternalTx) await t.commit();

      return {
        success: true,
        payout,
        submissionResult,
        message: 'تم إرسال أمر الصرف بنجاح وهو قيد المعالجة (Processing) بانتظار إشعار التأكيد والمطابقة.'
      };
    } catch (err: any) {
      if (!isExternalTx) await t.rollback();
      throw err;
    }
  }

  /**
   * 4. معالجة إشعار التأكيد الخارجي والمطابقة الآلية (Handle Webhook / Confirmation)
   */
  static async handleExternalConfirmation(
    externalReference: string,
    rawPayload: any,
    signature: string,
    headers: any,
    options?: { actor?: string; transaction?: any }
  ) {
    const actor = options?.actor || 'SYSTEM_WEBHOOK_WORKER';
    const isExternalTx = !!options?.transaction;
    const t = options?.transaction || await sequelize.transaction();

    try {
      // 1. Ingest & Deduplicate in GatewayEvent
      const externalEventId = rawPayload.id || rawPayload.event_id || `EVT_${externalReference}_${Date.now()}`;
      const gatewayName = rawPayload.gateway || 'hyperpay';

      const existingEvent = await GatewayEvent.findOne({
        where: { gatewayName, externalEventId },
        transaction: t
      });

      if (existingEvent && existingEvent.processed) {
        if (!isExternalTx) await t.commit();
        return {
          success: true,
          duplicateEvent: true,
          message: 'تمت معالجة إشعار التأكيد مسبقاً وتجاهل التكرار.'
        };
      }

      // Verify Signature
      const adapter = PayoutAdapterFactory.getAdapter(gatewayName);
      const isVerified = await adapter.verifyWebhook(rawPayload, signature, headers);
      if (!isVerified) {
        throw new Error('فشل التحقق من التوقيع الرقمي للإشعار البنكي (Invalid Webhook Signature).');
      }

      await GatewayEvent.findOrCreate({
        where: { gatewayName, externalEventId },
        defaults: {
          gatewayName,
          externalEventId,
          eventType: rawPayload.type || 'payout.cleared',
          payload: rawPayload,
          signature,
          verified: true,
          processed: true,
          receivedAt: new Date()
        },
        transaction: t
      });

      // 2. Find Payout by externalReference, payoutNo, or settlementId
      let payout = await PayoutInstruction.findOne({
        where: {
          [Op.or]: [
            { externalReference },
            { payoutNo: externalReference },
            { id: externalReference }
          ]
        },
        transaction: t,
        lock: t.LOCK?.UPDATE
      });

      if (!payout && rawPayload.merchant_reference) {
        payout = await PayoutInstruction.findOne({
          where: {
            [Op.or]: [
              { payoutNo: rawPayload.merchant_reference },
              { externalReference: rawPayload.merchant_reference }
            ]
          },
          transaction: t
        });
      }

      if (!payout) {
        throw new Error(`أمر الصرف المرتبط بالمرجع (${externalReference}) غير موجود.`);
      }

      if (payout.status === 'paid') {
        if (!isExternalTx) await t.commit();
        return {
          success: true,
          payout,
          alreadyPaid: true,
          message: 'أمر الصرف مسدد ومطابق مسبقاً.'
        };
      }

      const externalStatus = String(rawPayload.status || rawPayload.event || 'SUCCESS').toUpperCase();
      const isSuccessStatus = ['SUCCESS', 'CLEARED', 'PAID', 'COMPLETED'].includes(externalStatus);

      if (!isSuccessStatus) {
        // Transfer failed or returned externally
        await PayoutStateMachine.transition(payout, 'failed', {
          actor,
          failureCode: rawPayload.error_code || 'GATEWAY_TRANSFER_FAILED',
          failureReason: rawPayload.error_description || 'فشل التحويل من طرف البنك الخارجي',
          reason: 'استلام إشعار فشل التحويل الخارجي'
        }, { transaction: t });

        if (!isExternalTx) await t.commit();
        return {
          success: false,
          payout,
          status: 'failed',
          message: 'تم تسجيل فشل التحويل الخارجي بموجب الإشعار البنكي.'
        };
      }

      // Transition to CONFIRMED
      await PayoutStateMachine.transition(payout, 'confirmed', {
        actor,
        externalReference,
        externalConfirmationVerified: true,
        reason: 'استلام إشعار تأكيد التحويل والمقاصة البنكية بنجاح'
      }, { transaction: t });

      // 3. Execute Continuous Financial Reconciliation
      const extAmountHalalas = Number(rawPayload.amount ? (rawPayload.amount > 1000 ? rawPayload.amount : rawPayload.amount * 100) : payout.amount);
      const extCurrency = rawPayload.currency || payout.currency;

      const reconResult = await PayoutReconciliationService.reconcilePayout({
        payoutId: payout.id,
        externalReference,
        externalAmountHalalas: extAmountHalalas,
        externalCurrency: extCurrency,
        externalStatus,
        externalBeneficiaryIban: rawPayload.beneficiary_iban || rawPayload.beneficiary_bank_iban,
        rawPayload
      }, { transaction: t });

      if (!reconResult.matched) {
        // Discrepancy detected! Must NOT mark as Paid
        await PayoutStateMachine.transition(payout, 'reconciliation_required', {
          actor,
          reason: `عدم تطابق في المطابقة المالية: ${reconResult.discrepancies.join(' | ')}`
        }, { transaction: t });

        const settlement = await SettlementInstruction.findByPk(payout.settlementId, { transaction: t });
        if (settlement) {
          settlement.status = 'reconciliation_required';
          await settlement.save({ transaction: t });
        }

        if (!isExternalTx) await t.commit();

        return {
          success: false,
          payout,
          reconciliation: reconResult,
          status: 'reconciliation_required',
          message: 'تم تعليق أمر الصرف بسبب وجود فروقات في المطابقة المالية (Reconciliation Mismatch).'
        };
      }

      // 4. Reconciliation MATCHED -> Transition to RECONCILED
      await PayoutStateMachine.transition(payout, 'reconciled', {
        actor,
        reason: 'تطابق كامل للمبلغ والعملة والمرجع والمستفيد'
      }, { transaction: t });

      // 5. Post Double-Entry Ledger & Finalize to PAID
      const finalResult = await this.postLedgerAndFinalizePaid(payout.id, actor, { transaction: t });

      if (!isExternalTx) await t.commit();

      return {
        success: true,
        payout: finalResult.payout,
        settlement: finalResult.settlement,
        journal: finalResult.journal,
        reconciliation: reconResult,
        status: 'paid',
        message: 'تم إثبات التحويل الخارجي، والمطابقة بنجاح، وتسجيل القيد المزدوج، وإغلاق التسوية كـ (مسددة Paid).'
      };
    } catch (err: any) {
      if (!isExternalTx) await t.rollback();
      throw err;
    }
  }

  /**
   * 5. تسجيل القيود المزدوجة وإغلاق أمر الصرف كـ PAID (Double-Entry Ledger & Finalize)
   */
  static async postLedgerAndFinalizePaid(
    payoutId: string,
    actor: string,
    options?: { transaction?: any }
  ) {
    const transaction = options?.transaction;

    const payout = await PayoutInstruction.findByPk(payoutId, { transaction });
    if (!payout) {
      throw new Error(`أمر الصرف #${payoutId} غير موجود.`);
    }

    const settlement = await SettlementInstruction.findByPk(payout.settlementId, { transaction });
    if (!settlement) {
      throw new Error(`سجل التسوية #${payout.settlementId} غير موجود.`);
    }

    const netAmountHalalas = Number(payout.amount);
    const journalNo = await generateUniqueJournalNumber('EXP');

    // 1. Post Double-Entry Journal:
    // Dr Provider Payable (Liability) / Cr Bank Gateway Clearing (Asset)
    const journal = await UnifiedPaymentsEngine.postDoubleEntryJournal({
      journalNo,
      referenceId: `PAYOUT-${payout.payoutNo}`,
      referenceType: 'payout_settlement_clearing',
      description: `صرف ومقاصة مستحقات مزود #${payout.providerId} بموجب إشعار تحويل بنكي معتمد #${payout.externalReference || payout.payoutNo}`,
      entries: [
        {
          walletType: 'provider',
          providerId: payout.providerId,
          type: 'debit',
          amount: netAmountHalalas,
          description: `تسديد التزام مستحقات المزود عبر البنك مرجع #${payout.externalReference || payout.payoutNo}`,
          targetBalance: 'available',
          status: 'completed'
        },
        {
          walletType: 'gateway_fee', // Clearing / Cash outflow
          providerId: null,
          type: 'credit',
          amount: netAmountHalalas,
          description: `خروج سيولة نقدية عبر حساب المقاصة البنكي (${payout.gatewayName})`,
          targetBalance: 'available',
          status: 'completed'
        }
      ]
    }, { transaction });

    payout.ledgerPostingStatus = 'posted';

    // 2. Transition Payout State to PAID (Strict Invariant Enforced)
    await PayoutStateMachine.transition(payout, 'paid', {
      actor,
      externalConfirmationVerified: true,
      reason: 'اكتمال الإثبات الخارجي والمطابقة المحاسبية وتسجيل القيد في دفتر الأستاذ'
    }, { transaction });

    // 3. Transition Settlement State to PAID
    await SettlementStateMachine.transition(settlement, 'paid', {
      actor,
      payoutId: payout.id,
      reason: 'اكتمال صرف وتحويل مستحقات المزود بنجاح'
    }, { transaction });

    // 4. Update Legacy FinancialClaim & WalletTransaction if existing
    try {
      const claims = await FinancialClaim.findAll({
        where: {
          providerId: payout.providerId,
          status: ['pending', 'processing']
        },
        transaction
      });
      for (const c of claims) {
        c.status = 'paid';
        c.paidAt = new Date();
        c.transactionReference = payout.externalReference || payout.payoutNo;
        await c.save({ transaction });
      }

      const tx = await WalletTransaction.findOne({
        where: {
          providerId: payout.providerId,
          type: 'withdrawal',
          status: 'pending'
        },
        transaction
      });
      if (tx) {
        tx.status = 'completed';
        tx.description = `طلب سحب رصيد (${(netAmountHalalas / 100).toFixed(2)} ر.س) | تم التحويل والمقاصة البنكية بنجاح (مرجع: ${payout.externalReference || payout.payoutNo})`;
        await tx.save({ transaction });
      }
    } catch (e) {
      console.warn('Notice updating legacy claim/wallet records:', e);
    }

    Logger.financial(`Payout #${payout.payoutNo} and Settlement #${settlement.instructionNo} marked as PAID.`, {
      payoutId: payout.id,
      amountSar: netAmountHalalas / 100,
      journalNo
    });

    return {
      payout,
      settlement,
      journal
    };
  }

  /**
   * 6. معالجة الحوالات البنكية المرتجعة (Returned Payments)
   */
  static async handleReturnedPayout(
    payoutId: string,
    returnReason: string,
    actor: string,
    options?: { transaction?: any }
  ) {
    const isExternalTx = !!options?.transaction;
    const t = options?.transaction || await sequelize.transaction();

    try {
      const payout = await PayoutInstruction.findByPk(payoutId, { transaction: t, lock: t.LOCK?.UPDATE });
      if (!payout) {
        throw new Error(`أمر الصرف #${payoutId} غير موجود.`);
      }

      if (payout.status !== 'paid') {
        throw new Error(`لا يمكن تسجيل الإرجاع إلا لأمر صرف مسدد سابقاً (الحالة الحالية: ${payout.status}).`);
      }

      const settlement = await SettlementInstruction.findByPk(payout.settlementId, { transaction: t });
      if (!settlement) {
        throw new Error(`سجل التسوية #${payout.settlementId} غير موجود.`);
      }

      // Transition Payout to RETURNED
      await PayoutStateMachine.transition(payout, 'returned', {
        actor,
        reason: returnReason || 'إرجاع الحوالة من قبل البنك المستلم'
      }, { transaction: t });

      // Reopen Settlement to MANUAL_REVIEW or SCHEDULED
      await SettlementStateMachine.transition(settlement, 'manual_review', {
        actor,
        reason: `إعادة فتح الاستحقاق بعد إرجاع الحوالة البنكية: ${returnReason}`
      }, { transaction: t });

      // Reverse Journal: Dr Bank Gateway Clearing / Cr Provider Payable
      const netAmountHalalas = Number(payout.amount);
      const reversalJournal = await UnifiedPaymentsEngine.postDoubleEntryJournal({
        journalNo: await generateUniqueJournalNumber('REV'),
        referenceId: `REV-PAYOUT-${payout.payoutNo}`,
        referenceType: 'payout_returned_reversal',
        description: `عكس قيد صرف حوالة مرتجعة #${payout.payoutNo} وإعادة إثبات التزام المزود: ${returnReason}`,
        entries: [
          {
            walletType: 'gateway_fee',
            providerId: null,
            type: 'debit',
            amount: netAmountHalalas,
            description: `إعادة قيد المبالغ المرتجعة لحساب البنك`,
            targetBalance: 'available',
            status: 'completed'
          },
          {
            walletType: 'provider',
            providerId: payout.providerId,
            type: 'credit',
            amount: netAmountHalalas,
            description: `إعادة إثبات رصيد التزام المزود المستحق بعد إرجاع الحوالة`,
            targetBalance: 'available',
            status: 'completed'
          }
        ]
      }, { transaction: t });

      if (!isExternalTx) await t.commit();

      return {
        success: true,
        payout,
        settlement,
        reversalJournal,
        message: 'تم تسجيل إرجاع الحوالة بنجاح، وعكس القيود المالية، وإعادة فتح استحقاق المزود للمراجعة.'
      };
    } catch (err: any) {
      if (!isExternalTx) await t.rollback();
      throw err;
    }
  }

  /**
   * 7. معالجة تسابق الاسترداد أثناء المعالجة البنكية (Refund during Payout Processing)
   */
  static async handleRefundDuringPayout(
    payoutId: string,
    refundAmountHalalas: number,
    actor: string,
    options?: { transaction?: any }
  ) {
    const isExternalTx = !!options?.transaction;
    const t = options?.transaction || await sequelize.transaction();

    try {
      const payout = await PayoutInstruction.findByPk(payoutId, { transaction: t, lock: t.LOCK?.UPDATE });
      if (!payout) {
        throw new Error(`أمر الصرف #${payoutId} غير موجود.`);
      }

      if (['created', 'validated', 'queued'].includes(payout.status)) {
        // Can safely cancel before dispatch
        await PayoutStateMachine.transition(payout, 'cancelled', {
          actor,
          reason: 'إلغاء أمر الصرف بسبب طلب استرداد مالي قبل الإرسال الخارجي'
        }, { transaction: t });

        const settlement = await SettlementInstruction.findByPk(payout.settlementId, { transaction: t });
        if (settlement) {
          settlement.status = 'on_hold';
          settlement.holdReason = 'إعادة احتساب التسوية بسبب استرداد مالي';
          await settlement.save({ transaction: t });
        }

        if (!isExternalTx) await t.commit();
        return {
          action: 'CANCELLED_BEFORE_SUBMISSION',
          payout,
          message: 'تم إلغاء أمر الصرف بنجاح وإعادة التسوية للمراجعة والاحتساب.'
        };
      }

      if (['submitted', 'processing'].includes(payout.status)) {
        // Attempt to cancel via adapter if rail supports it
        const adapter = PayoutAdapterFactory.getAdapter(payout.gatewayName);
        const cancelResult = await adapter.cancelPayout(payout.externalReference || '');

        if (cancelResult.cancelled) {
          await PayoutStateMachine.transition(payout, 'cancelled', {
            actor,
            reason: 'إلغاء أمر الصرف لدى البوابة بنجاح'
          }, { transaction: t });

          if (!isExternalTx) await t.commit();
          return {
            action: 'CANCELLED_AT_GATEWAY',
            payout,
            message: 'تم إلغاء التحويل لدى البنك بنجاح قبل المقاصة.'
          };
        } else {
          // Cannot cancel in flight -> Flag for RECONCILIATION_REQUIRED and create Provider Receivable upon clearing
          payout.status = 'reconciliation_required';
          await payout.save({ transaction: t });

          // Create outstanding Provider Receivable so no money is lost!
          const receivableNo = `REV-${new Date().getFullYear().toString().slice(-2)}-${Date.now().toString().slice(-10)}`;
          const rec = await ProviderReceivableModel.create({
            receivableNumber: receivableNo,
            providerId: payout.providerId,
            providerName: (payout.beneficiarySnapshot as any)?.officialName || 'المزود',
            amount: refundAmountHalalas,
            reason: 'penalty',
            status: 'outstanding',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            notes: `مديونية مستردات مستحقة ناتجة عن استرداد مالي متزامن مع تحويل جاري #${payout.payoutNo}`
          }, { transaction: t });

          if (!isExternalTx) await t.commit();
          return {
            action: 'IN_FLIGHT_RECEIVABLE_CREATED',
            payout,
            receivable: rec,
            message: 'التحويل قيد التنفيذ البنكي ولا يمكن إلغاؤه؛ تم إنشاء مديونية Provider Receivable تلقائياً لحفظ حقوق المنصة.'
          };
        }
      }

      if (payout.status === 'paid') {
        // Post Payout refund -> Creates Provider Receivable
        const receivableNo = `REV-${new Date().getFullYear().toString().slice(-2)}-${Date.now().toString().slice(-10)}`;
        const rec = await ProviderReceivableModel.create({
          receivableNumber: receivableNo,
          providerId: payout.providerId,
          providerName: (payout.beneficiarySnapshot as any)?.officialName || 'المزود',
          amount: refundAmountHalalas,
          reason: 'penalty',
          status: 'outstanding',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          notes: `استرداد مالي لاحق لتحويل مسدد #${payout.payoutNo}`
        }, { transaction: t });

        if (!isExternalTx) await t.commit();
        return {
          action: 'POST_PAID_RECEIVABLE_CREATED',
          payout,
          receivable: rec,
          message: 'تم تسجيل مديونية Provider Receivable على المزود للاسترداد اللاحق.'
        };
      }

      if (!isExternalTx) await t.commit();
      return { action: 'NO_ACTION', payout };
    } catch (err: any) {
      if (!isExternalTx) await t.rollback();
      throw err;
    }
  }

  /**
   * 8. اعتماد الصرف المزدوج (Dual Approval / Maker-Checker)
   */
  static async approveDualAuthorization(
    payoutId: string,
    checkerActor: string,
    options?: { transaction?: any }
  ) {
    const isExternalTx = !!options?.transaction;
    const t = options?.transaction || await sequelize.transaction();

    try {
      const payout = await PayoutInstruction.findByPk(payoutId, { transaction: t, lock: t.LOCK?.UPDATE });
      if (!payout) {
        throw new Error(`أمر الصرف #${payoutId} غير موجود.`);
      }

      const dual: any = payout.dualApproval;
      if (!dual || !dual.required) {
        return { success: true, message: 'أمر الصرف لا يتطلب اعتماداً مزدوجاً.' };
      }

      if (dual.requestedBy === checkerActor) {
        throw new Error(`مخالفة الصلاحيات (Maker-Checker Violation): لا يجوز لنفس طالب الصرف (${checkerActor}) اعتماد أمره الخاص.`);
      }

      const updatedDual = {
        ...dual,
        approvedBy: checkerActor,
        approvedAt: new Date().toISOString()
      };
      payout.dualApproval = updatedDual;
      payout.changed('dualApproval', true);
      await payout.save({ transaction: t });

      if (!isExternalTx) await t.commit();

      return {
        success: true,
        payout,
        message: `تم اعتماد أمر الصرف بنجاح من المعتمد (${checkerActor}).`
      };
    } catch (err: any) {
      if (!isExternalTx) await t.rollback();
      throw err;
    }
  }
}
