/**
 * @file SettlementEligibilityEngine.ts
 * @description محرك التحقق الصارم من أهلية التسوية واستحقاق التحويل المالي للمزود (P0 Settlement Eligibility Engine).
 * يفحص كافة القيود التشغيلية والقانونية والمالية لمنع إنشاء أي أمر صرف (Payout Instruction) دون استيفاء كامل الشروط.
 */

import { 
  SettlementInstruction, 
  Beneficiary, 
  ProviderReceivableModel, 
  PayoutInstruction,
  RefundAllocation,
  SplitTransaction,
  sequelize
} from '../../models/Database.js';
import { Op } from 'sequelize';

export interface SettlementEligibilityCheckItem {
  passed: boolean;
  code: string;
  message: string;
  data?: any;
}

export interface SettlementEligibilityResult {
  eligible: boolean;
  reasons: string[];
  checks: Record<string, SettlementEligibilityCheckItem>;
  grossPayableHalalas: number;
  refundDeductionsHalalas: number;
  receivablesOffsetHalalas: number;
  penaltiesHalalas: number;
  adjustmentsHalalas: number;
  netPayableHalalas: number;
  remainingReceivableHalalas: number;
  beneficiarySnapshot?: {
    beneficiaryId: number;
    officialName: string;
    bankName: string;
    ibanMasked: string;
    ibanHash: string;
    kycStatus: string;
    verifiedAt: Date | null;
  };
}

export class SettlementEligibilityEngine {
  /**
   * قناع إخفاء الآيبان لحماية البيانات الحساسة (Masking)
   */
  static maskIban(iban: string): string {
    if (!iban || iban.length < 8) return 'SA** **** **** ****';
    const clean = iban.replace(/\s+/g, '');
    const first4 = clean.substring(0, 4);
    const last4 = clean.substring(clean.length - 4);
    return `${first4} **** **** ${last4}`;
  }

  /**
   * توليد بصمة تجزئة الآيبان (Hash Reference)
   */
  static hashIban(iban: string): string {
    if (!iban) return 'HASH_UNKNOWN';
    let hash = 0;
    const clean = iban.replace(/\s+/g, '').toUpperCase();
    for (let i = 0; i < clean.length; i++) {
      const char = clean.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return `IBAN_H_${Math.abs(hash).toString(16).toUpperCase()}`;
  }

  /**
   * تقييم أهلية التسوية بشكل شامل قبل تحويلها إلى أمر صرف
   */
  static async evaluateEligibility(
    settlementIdOrInstructionNo: string,
    options?: { overrideChecks?: string[]; transaction?: any }
  ): Promise<SettlementEligibilityResult> {
    const transaction = options?.transaction;

    // 1. Fetch Settlement Record
    const settlement = await SettlementInstruction.findOne({
      where: {
        [Op.or]: [
          { id: settlementIdOrInstructionNo },
          { instructionNo: settlementIdOrInstructionNo }
        ]
      },
      transaction
    });

    if (!settlement) {
      return {
        eligible: false,
        reasons: ['سجل التسوية المطلوب غير موجود في النظام.'],
        checks: {
          settlement_exists: {
            passed: false,
            code: 'SETTLEMENT_NOT_FOUND',
            message: 'سجل التسوية غير موجود.'
          }
        },
        grossPayableHalalas: 0,
        refundDeductionsHalalas: 0,
        receivablesOffsetHalalas: 0,
        penaltiesHalalas: 0,
        adjustmentsHalalas: 0,
        netPayableHalalas: 0,
        remainingReceivableHalalas: 0
      };
    }

    const checks: Record<string, SettlementEligibilityCheckItem> = {};
    const reasons: string[] = [];

    // Check 1: Settlement Status Check
    const allowedStatuses = ['draft', 'pending_eligibility', 'eligible', 'scheduled'];
    const isStatusAllowed = allowedStatuses.includes(settlement.status);
    checks.settlement_status = {
      passed: isStatusAllowed,
      code: isStatusAllowed ? 'STATUS_OK' : 'INVALID_SETTLEMENT_STATUS',
      message: isStatusAllowed 
        ? `حالة التسوية الحالية (${settlement.status}) صالحة للجدولة والصرف.` 
        : `حالة التسوية (${settlement.status}) غير مؤهلة لإنشاء أمر تحويل جديد.`
    };
    if (!isStatusAllowed) {
      reasons.push(checks.settlement_status.message);
    }

    // Check 2: Check for existing active or paid Payout Instruction
    const existingActivePayout = await PayoutInstruction.findOne({
      where: {
        settlementId: settlement.id,
        status: {
          [Op.in]: ['created', 'validated', 'queued', 'submitted', 'processing', 'confirmed', 'reconciled', 'paid']
        }
      },
      transaction
    });

    const noDuplicateActive = !existingActivePayout;
    checks.no_duplicate_payout = {
      passed: noDuplicateActive,
      code: noDuplicateActive ? 'NO_DUPLICATE' : 'ACTIVE_PAYOUT_EXISTS',
      message: noDuplicateActive
        ? 'لا يوجد أمر صرف نشط أو مسدد مسبقاً لهذه التسوية.'
        : `يوجد بالفعل أمر صرف نشط/مسدد برقم (${existingActivePayout?.payoutNo}) وحالة (${existingActivePayout?.status}).`,
      data: existingActivePayout ? { payoutNo: existingActivePayout.payoutNo, status: existingActivePayout.status } : undefined
    };
    if (!noDuplicateActive) {
      reasons.push(checks.no_duplicate_payout.message);
    }

    // Check 3: Check Event / Booking Completion
    let bookingCompleted = true;
    let bookingData: any = null;
    if (settlement.paymentId) {
      // Find booking by paymentId or split transaction
      const split = await SplitTransaction.findOne({
        where: { paymentId: settlement.paymentId },
        transaction
      });
      if (split && split.bookingId && sequelize.models.Booking) {
        const booking: any = await (sequelize.models.Booking as any).findByPk(split.bookingId, { transaction });
        if (booking) {
          bookingData = booking;
          // Check booking status
          if (booking.status === 'cancelled' || booking.status === 'rejected') {
            bookingCompleted = false;
            checks.booking_status = {
              passed: false,
              code: 'BOOKING_CANCELLED',
              message: `الحجز المرتبط #${booking.id} بحالة (${booking.status}) ولا يجوز صرف مستحقاته.`
            };
            reasons.push(checks.booking_status.message);
          } else {
            checks.booking_status = {
              passed: true,
              code: 'BOOKING_VALID',
              message: `الحجز المرتبط #${booking.id} بحالة مقبولة (${booking.status}).`
            };
          }
        }
      }
    }

    // Check 4: Settlement Eligibility Date (T+X Delay)
    const now = new Date();
    const isDateReached = settlement.eligibleAt <= now;
    checks.eligibility_date = {
      passed: isDateReached,
      code: isDateReached ? 'DATE_REACHED' : 'SETTLEMENT_DELAY_ACTIVE',
      message: isDateReached
        ? `تاريخ الاستحقاق (${settlement.eligibleAt.toISOString()}) قد حان.`
        : `فترة تأجيل التسوية لم تنتهِ بعد (تاريخ الاستحقاق: ${settlement.eligibleAt.toISOString()}).`
    };
    if (!isDateReached) {
      reasons.push(checks.eligibility_date.message);
    }

    // Check 5: No Active Dispute or Hold
    const hasHold = settlement.status === 'on_hold' || !!settlement.holdReason;
    checks.no_dispute_or_hold = {
      passed: !hasHold,
      code: !hasHold ? 'NO_HOLD' : 'SETTLEMENT_ON_HOLD',
      message: !hasHold
        ? 'التسوية غير معلقة ولا يوجد نزاع مالي قائم.'
        : `التسوية معلقة: ${settlement.holdReason || 'نزاع أو مراجعة امتثال'}`
    };
    if (hasHold) {
      reasons.push(checks.no_dispute_or_hold.message);
    }

    // Check 6: Provider Beneficiary & Bank Verification
    const beneficiary = await Beneficiary.findOne({
      where: { providerId: settlement.providerId },
      transaction
    });

    let beneficiaryValid = false;
    let beneficiarySnapshot: any = undefined;

    if (!beneficiary) {
      checks.beneficiary_verification = {
        passed: false,
        code: 'NO_BENEFICIARY',
        message: 'لا توجد بيانات حساب بنكي مسجلة لهذا المزود.'
      };
      reasons.push(checks.beneficiary_verification.message);
    } else {
      const isKycActive = beneficiary.kycStatus === 'active';
      const hasValidIban = beneficiary.iban && beneficiary.iban.startsWith('SA') && beneficiary.iban.replace(/\s+/g, '').length === 24;
      beneficiaryValid = isKycActive && hasValidIban;

      checks.beneficiary_verification = {
        passed: beneficiaryValid,
        code: beneficiaryValid ? 'BENEFICIARY_VERIFIED' : 'BENEFICIARY_UNVERIFIED_OR_INVALID',
        message: beneficiaryValid
          ? `الحساب البنكي للمستفيد (${beneficiary.officialName} - ${beneficiary.bankName}) موثق ونشط.`
          : `الحساب البنكي غير مكتمل أو غير موثق (الحالة: ${beneficiary.kycStatus}، الآيبان: ${beneficiary.iban ? 'غير صالح' : 'مفقود'}).`
      };

      if (!beneficiaryValid) {
        reasons.push(checks.beneficiary_verification.message);
      }

      beneficiarySnapshot = {
        beneficiaryId: beneficiary.id,
        officialName: beneficiary.officialName,
        bankName: beneficiary.bankName,
        ibanMasked: this.maskIban(beneficiary.iban),
        ibanHash: this.hashIban(beneficiary.iban),
        kycStatus: beneficiary.kycStatus,
        verifiedAt: beneficiary.verifiedAt
      };
    }

    // Check 7: Deduct any Refunds / Adjustments associated with paymentId
    let refundDeductionsHalalas = 0;
    if (settlement.paymentId) {
      try {
        const refunds = await RefundAllocation.findAll({
          where: {
            paymentId: settlement.paymentId,
            status: ['allocated', 'posted', 'processing', 'APPROVED', 'SUCCEEDED', 'POSTED', 'PROCESSING']
          },
          transaction
        });

        for (const ref of refunds) {
          refundDeductionsHalalas += Number(ref.providerDeductionAmount || 0);
        }
      } catch (err) {
        // Fallback gracefully if refunds table not populated
      }
    }

    // Check 8: Check Provider Outstanding Receivables (Offset Calculation)
    const outstandingReceivables = await ProviderReceivableModel.findAll({
      where: {
        providerId: settlement.providerId,
        status: ['outstanding', 'partially_paid']
      },
      transaction
    });

    let totalOutstandingReceivableHalalas = 0;
    for (const rec of outstandingReceivables) {
      totalOutstandingReceivableHalalas += Number(rec.amount || 0);
    }

    // Calculate Net Provider Payout
    const grossPayableHalalas = Number(settlement.amount || 0);
    const penaltiesHalalas = Number(settlement.penaltiesAmount || 0);
    const adjustmentsHalalas = 0;

    const basePayableAfterRefunds = Math.max(0, grossPayableHalalas - refundDeductionsHalalas - penaltiesHalalas);
    
    // Offset receivables without making Payout negative
    let receivablesOffsetHalalas = 0;
    let remainingReceivableHalalas = totalOutstandingReceivableHalalas;

    if (totalOutstandingReceivableHalalas > 0) {
      if (basePayableAfterRefunds >= totalOutstandingReceivableHalalas) {
        receivablesOffsetHalalas = totalOutstandingReceivableHalalas;
        remainingReceivableHalalas = 0;
      } else {
        receivablesOffsetHalalas = basePayableAfterRefunds;
        remainingReceivableHalalas = totalOutstandingReceivableHalalas - basePayableAfterRefunds;
      }
    }

    const netPayableHalalas = Math.max(0, basePayableAfterRefunds - receivablesOffsetHalalas);

    checks.financial_calculation = {
      passed: true,
      code: 'CALCULATION_OK',
      message: `المستحق الإجمالي: ${(grossPayableHalalas / 100).toFixed(2)} ر.س | استقطاع المستردات: ${(refundDeductionsHalalas / 100).toFixed(2)} ر.س | مقاصة المديونيات: ${(receivablesOffsetHalalas / 100).toFixed(2)} ر.س | الصافي النهائي: ${(netPayableHalalas / 100).toFixed(2)} ر.س`,
      data: {
        grossPayableHalalas,
        refundDeductionsHalalas,
        receivablesOffsetHalalas,
        penaltiesHalalas,
        netPayableHalalas,
        remainingReceivableHalalas
      }
    };

    // Overall Eligibility Flag
    const isEligible = isStatusAllowed && noDuplicateActive && (!bookingData || bookingCompleted) && isDateReached && !hasHold && beneficiaryValid;

    return {
      eligible: isEligible,
      reasons,
      checks,
      grossPayableHalalas,
      refundDeductionsHalalas,
      receivablesOffsetHalalas,
      penaltiesHalalas,
      adjustmentsHalalas,
      netPayableHalalas,
      remainingReceivableHalalas,
      beneficiarySnapshot
    };
  }
}
