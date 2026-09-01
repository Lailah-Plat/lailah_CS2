/**
 * @file PayoutReconciliationService.ts
 * @description خدمة المطابقة والمقاصة المالية لأوامر الصرف (P0 Payout Reconciliation Service).
 * تفحص وتطابق المبالغ والعملات والمستفيدين بين السجلات الداخلية والإشعارات البنكية الخارجية.
 */

import { PayoutInstruction, ReconciliationRun, ReconciliationItem, SettlementInstruction } from '../../models/Database.js';

export interface PayoutReconciliationInput {
  payoutId: string;
  externalReference: string;
  externalAmountHalalas: number;
  externalCurrency: string;
  externalStatus: string;
  externalBeneficiaryIban?: string;
  clearedAt?: Date;
  rawPayload?: any;
}

export interface PayoutReconciliationOutput {
  matched: boolean;
  status: 'MATCH' | 'MISMATCH';
  expectedAmountHalalas: number;
  actualAmountHalalas: number;
  differenceHalalas: number;
  expectedCurrency: string;
  actualCurrency: string;
  discrepancies: string[];
  reconciliationItemId?: string;
}

export class PayoutReconciliationService {
  /**
   * مطابقة أمر الصرف المالي مع البيانات الخارجية الواردة من البنك أو بوابة الدفع
   */
  static async reconcilePayout(
    input: PayoutReconciliationInput,
    options?: { transaction?: any }
  ): Promise<PayoutReconciliationOutput> {
    const transaction = options?.transaction;
    const payout = await PayoutInstruction.findByPk(input.payoutId, { transaction });

    if (!payout) {
      throw new Error(`أمر الصرف #${input.payoutId} غير موجود لتنفيذ المطابقة المالية.`);
    }

    const discrepancies: string[] = [];

    // 1. Amount Verification (Halalas)
    const expectedAmountHalalas = Number(payout.amount || 0);
    const actualAmountHalalas = Number(input.externalAmountHalalas || 0);
    const differenceHalalas = Math.abs(expectedAmountHalalas - actualAmountHalalas);

    if (expectedAmountHalalas !== actualAmountHalalas) {
      discrepancies.push(
        `اختلاف في المبلغ: المتوقع ${(expectedAmountHalalas / 100).toFixed(2)} ${payout.currency} والمستلم ${(actualAmountHalalas / 100).toFixed(2)} ${input.externalCurrency}`
      );
    }

    // 2. Currency Verification
    const expectedCurrency = (payout.currency || 'SAR').toUpperCase();
    const actualCurrency = (input.externalCurrency || 'SAR').toUpperCase();
    if (expectedCurrency !== actualCurrency) {
      discrepancies.push(`اختلاف في العملة: المتوقع (${expectedCurrency}) والمستلم (${actualCurrency})`);
    }

    // 3. External Reference Verification
    if (payout.externalReference && input.externalReference && payout.externalReference !== input.externalReference) {
      discrepancies.push(
        `عدم تطابق المرجع الخارجي: المسجل (${payout.externalReference}) والوارد بالإشعار (${input.externalReference})`
      );
    }

    // 4. Beneficiary Verification (if provided)
    if (input.externalBeneficiaryIban) {
      const snap: any = payout.beneficiarySnapshot;
      if (snap && snap.ibanMasked) {
        // Compare last 4 digits
        const cleanExt = input.externalBeneficiaryIban.replace(/\s+/g, '');
        const extLast4 = cleanExt.slice(-4);
        if (!snap.ibanMasked.endsWith(extLast4)) {
          discrepancies.push(`اختلاف في حساب المستفيد البنكي المقاص.`);
        }
      }
    }

    // 5. Status Verification
    const successStatuses = ['SUCCESS', 'CLEARED', 'PAID', 'COMPLETED', 'CONFIRMED'];
    if (!successStatuses.includes(input.externalStatus.toUpperCase())) {
      discrepancies.push(`حالة التحويل الخارجي ليست مؤكدة/ناجحة (${input.externalStatus})`);
    }

    const matched = discrepancies.length === 0;

    // Record Reconciliation Item for continuous audit
    let reconciliationItemId: string | undefined = undefined;
    try {
      const item = await ReconciliationItem.create({
        runId: `REC_RUN_${new Date().toISOString().slice(0, 10)}`,
        paymentId: payout.settlementId,
        gatewayReference: input.externalReference || payout.externalReference || payout.payoutNo,
        expectedAmount: expectedAmountHalalas,
        actualAmount: actualAmountHalalas,
        difference: differenceHalalas,
        reason: matched ? 'مطابقة آلية ناجحة ومؤكدة بنسبة 100%' : `فروقات مطابقة: ${discrepancies.join(' | ')}`,
        status: matched ? 'resolved' : 'open'
      }, { transaction });
      reconciliationItemId = item.id;
    } catch (e) {
      console.warn('Notice while recording reconciliation audit item:', e);
    }

    return {
      matched,
      status: matched ? 'MATCH' : 'MISMATCH',
      expectedAmountHalalas,
      actualAmountHalalas,
      differenceHalalas,
      expectedCurrency,
      actualCurrency,
      discrepancies,
      reconciliationItemId
    };
  }
}
