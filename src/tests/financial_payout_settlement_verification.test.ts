/**
 * @file financial_payout_settlement_verification.test.ts
 * @description حزمة اختبارات شاملة وصارمة لتوحيد دورة التسوية والتحويل المالي للمزود (P0 Payout & Settlement Verification).
 * تختبر سلسلة الحلقات:
 * Eligible Settlement -> Payout Instruction -> External Submission -> External Reference -> Verified Confirmation -> Reconciliation -> Ledger Posting -> PAID
 */

import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { 
  sequelize, 
  Beneficiary, 
  SettlementInstruction, 
  PayoutInstruction, 
  ProviderReceivableModel,
  Booking,
  GatewayEvent,
  ReconciliationItem,
  LedgerJournal,
  LedgerEntry,
  Wallet,
  WalletTransaction,
  FinancialClaim
} from '../models/Database.js';
import { SettlementEligibilityEngine } from '../services/finance/SettlementEligibilityEngine.js';
import { PayoutStateMachine } from '../services/payout/PayoutStateMachine.js';
import { SettlementStateMachine } from '../services/payout/SettlementStateMachine.js';
import { PayoutOrchestrator } from '../services/payout/PayoutOrchestrator.js';
import { MockBankPayoutAdapter } from '../services/payout/PayoutProviderAdapter.js';
import { PayoutReconciliationService } from '../services/payout/PayoutReconciliationService.js';

function generateValidSaudiIban(seed: number): string {
  return `SA80${String(seed).padStart(20, '0')}`;
}

describe('P0 — توحيد دورة التسوية والتحويل للمزود (Payout & Settlement Verification)', () => {
  beforeAll(async () => {
    try {
      await Beneficiary.sync();
      await SettlementInstruction.sync();
      await PayoutInstruction.sync();
      await ProviderReceivableModel.sync();
      await GatewayEvent.sync();
      await ReconciliationItem.sync();
      await LedgerJournal.sync();
      await LedgerEntry.sync();
      await Wallet.sync();
      await WalletTransaction.sync();
      await FinancialClaim.sync();
    } catch (e) {
      console.warn('Sync notice in test setup:', e);
    }
  });

  beforeEach(async () => {
    MockBankPayoutAdapter.clearSimulation();
  });

  it('1. يمنع النظام بشكل صارم وسم أي تسوية كـ PAID مباشرة دون أمر صرف مدفوع ومطابق (Invariant Enforcement)', async () => {
    const runId = Date.now() + '_' + Math.floor(Math.random() * 100000);
    const providerId = Math.floor(Math.random() * 800000) + 100000;
    const beneficiary = await Beneficiary.create({
      providerId,
      officialName: 'قاعة الروابي',
      commercialRegister: `CR_${runId}`,
      iban: generateValidSaudiIban(providerId),
      bankName: 'مصرف الراجحي',
      bankCode: 'RJHI',
      kycStatus: 'active',
      verifiedAt: new Date()
    });

    const settlement = await SettlementInstruction.create({
      paymentId: `PAY_TEST_INV_${runId}`,
      providerId,
      beneficiaryId: beneficiary.id,
      instructionNo: `SRV-26-${Math.floor(Math.random() * 8999999999 + 1000000000)}`,
      amount: 500000, // 5,000.00 SAR
      netPayableAmount: 500000,
      currency: 'SAR',
      eligibleAt: new Date(Date.now() - 3600000), // eligible 1 hour ago
      status: 'scheduled'
    });

    // Attempting to directly transition to 'paid' without a payoutId or with an unpaid payout MUST throw an error
    await expect(
      SettlementStateMachine.transition(settlement, 'paid', {
        actor: 'TEST_HACKER',
        reason: 'محاولة تجاوز التحويل الخارجي'
      })
    ).rejects.toThrow(/Settlement State Violation|Settlement Invariant Violation/);

    expect(settlement.status).toBe('scheduled');
  });

  it('2. يفحص محرك الأهلية (SettlementEligibilityEngine) الحساب البنكي والآيبان وتاريخ الاستحقاق والنزاعات', async () => {
    const runId = Date.now() + '_' + Math.floor(Math.random() * 100000);
    const providerId = Math.floor(Math.random() * 800000) + 100000;

    // A) Provider with unverified Beneficiary (KYC pending)
    const beneficiary = await Beneficiary.create({
      providerId,
      officialName: 'مؤسسة إشراقة لتنظيم المناسبات',
      commercialRegister: `CR_${runId}`,
      iban: generateValidSaudiIban(providerId),
      bankName: 'البنك الأهلي السعودي',
      bankCode: 'NCB',
      kycStatus: 'pending',
      verifiedAt: null
    });

    const settlementUnverified = await SettlementInstruction.create({
      paymentId: `PAY_TEST_NO_BEN_${runId}`,
      providerId,
      beneficiaryId: beneficiary.id,
      instructionNo: `SRV-26-${Math.floor(Math.random() * 8999999999 + 1000000000)}`,
      amount: 300000,
      netPayableAmount: 300000,
      currency: 'SAR',
      eligibleAt: new Date(Date.now() - 3600000),
      status: 'scheduled'
    });

    const eligibilityNoBen = await SettlementEligibilityEngine.evaluateEligibility(settlementUnverified.id);
    expect(eligibilityNoBen.eligible).toBe(false);
    expect(eligibilityNoBen.checks.beneficiary_verification.passed).toBe(false);

    // B) Verify Beneficiary (KYC active)
    beneficiary.kycStatus = 'active';
    beneficiary.verifiedAt = new Date();
    await beneficiary.save();

    const eligibilityVerified = await SettlementEligibilityEngine.evaluateEligibility(settlementUnverified.id);
    expect(eligibilityVerified.eligible).toBe(true);
    expect(eligibilityVerified.beneficiarySnapshot?.officialName).toBe('مؤسسة إشراقة لتنظيم المناسبات');
    expect(eligibilityVerified.beneficiarySnapshot?.ibanMasked).toContain('****');
  });

  it('3. يقوم محرك الأهلية بإجراء مقاصة آلية للمديونيات المعلقة (Receivables Offset) قبل الصرف', async () => {
    const runId = Date.now() + '_' + Math.floor(Math.random() * 100000);
    const providerId = Math.floor(Math.random() * 800000) + 200000;
    const beneficiary = await Beneficiary.create({
      providerId,
      officialName: 'قاعة اللؤلؤة الفندقية',
      commercialRegister: `CR_${runId}`,
      iban: generateValidSaudiIban(providerId),
      bankName: 'مصرف الراجحي',
      bankCode: 'RJHI',
      kycStatus: 'active',
      verifiedAt: new Date()
    });

    // Create an outstanding receivable debt on the provider of 1,000.00 SAR (100,000 Halalas)
    await ProviderReceivableModel.create({
      receivableNumber: `REV-26-${Math.floor(Math.random() * 8999999999 + 1000000000)}`,
      providerId,
      providerName: 'قاعة اللؤلؤة',
      amount: 100000,
      reason: 'penalty',
      status: 'outstanding',
      dueDate: new Date()
    });

    // Settlement gross payable: 4,000.00 SAR (400,000 Halalas)
    const settlement = await SettlementInstruction.create({
      paymentId: `PAY_TEST_REC_${runId}`,
      providerId,
      beneficiaryId: beneficiary.id,
      instructionNo: `SRV-26-${Math.floor(Math.random() * 8999999999 + 1000000000)}`,
      amount: 400000,
      netPayableAmount: 400000,
      currency: 'SAR',
      eligibleAt: new Date(Date.now() - 1000),
      status: 'scheduled'
    });

    const eligibility = await SettlementEligibilityEngine.evaluateEligibility(settlement.id);
    expect(eligibility.eligible).toBe(true);
    expect(eligibility.grossPayableHalalas).toBe(400000);
    expect(eligibility.receivablesOffsetHalalas).toBe(100000);
    expect(eligibility.netPayableHalalas).toBe(300000); // 3,000.00 SAR net payout!
  });

  it('4. دورة التحويل الكاملة: إنشاء أمر الصرف -> الإرسال -> تأكيد البنك -> المطابقة -> القيود المزدوجة -> PAID', async () => {
    const runId = Date.now() + '_' + Math.floor(Math.random() * 100000);
    const providerId = Math.floor(Math.random() * 800000) + 300000;
    const beneficiary = await Beneficiary.create({
      providerId,
      officialName: 'شركة النخبة للضيافة',
      commercialRegister: `CR_${runId}`,
      iban: generateValidSaudiIban(providerId),
      bankName: 'بنك الرياض',
      bankCode: 'RIBL',
      kycStatus: 'active',
      verifiedAt: new Date()
    });

    const settlement = await SettlementInstruction.create({
      paymentId: `PAY_FULL_CYCLE_${runId}`,
      providerId,
      beneficiaryId: beneficiary.id,
      instructionNo: `SRV-26-${Math.floor(Math.random() * 8999999999 + 1000000000)}`,
      amount: 250000, // 2,500.00 SAR
      netPayableAmount: 250000,
      currency: 'SAR',
      eligibleAt: new Date(Date.now() - 3600000),
      status: 'scheduled'
    });

    // Step A: Create Payout Instruction
    const createRes = await PayoutOrchestrator.createPayoutInstruction({
      settlementId: settlement.id,
      actor: 'FINANCE_MAKER',
      gatewayName: 'mock_bank'
    });

    expect(createRes.success).toBe(true);
    expect(createRes.payout.status).toBe('validated');
    expect(createRes.snapshot.netPayoutAmountHalalas).toBe(250000);
    expect(createRes.payout.payoutNo).toMatch(/^EXP-\d{2}-\d{10}$/);

    const payoutId = createRes.payout.id;

    // Step B: Dispatch Payout to Banking Network
    const dispatchRes = await PayoutOrchestrator.dispatchPayout(payoutId, 'FINANCE_OPERATOR');
    expect(dispatchRes.success).toBe(true);
    expect(dispatchRes.payout.status).toBe('processing');
    expect(['submitted', 'accepted']).toContain(dispatchRes.payout.submissionStatus);
    expect(dispatchRes.payout.externalReference).toBeDefined();

    const extRef = dispatchRes.payout.externalReference;

    // Step C: Bank Webhook Confirmation & Continuous Reconciliation
    const webhookPayload = {
      id: `EVT_BANK_ACK_${runId}`,
      transaction_reference: extRef,
      status: 'SUCCESS',
      amount: 250000,
      currency: 'SAR',
      gateway: 'mock_bank',
      beneficiary_iban: beneficiary.iban
    };

    const confirmRes = await PayoutOrchestrator.handleExternalConfirmation(
      extRef,
      webhookPayload,
      'SIG_VALID_HASH',
      { 'x-signature': 'SIG_VALID_HASH' },
      { actor: 'WEBHOOK_WORKER' }
    );

    expect(confirmRes.success).toBe(true);
    expect(confirmRes.status).toBe('paid');
    expect(confirmRes.reconciliation.matched).toBe(true);
    expect(confirmRes.payout.status).toBe('paid');
    expect(confirmRes.payout.paidAt).toBeDefined();

    // Verify Settlement status was updated to PAID
    const updatedSettlement = await SettlementInstruction.findByPk(settlement.id);
    expect(updatedSettlement?.status).toBe('paid');
    expect(updatedSettlement?.paidAt).toBeDefined();

    // Verify Double-Entry Journal was posted
    expect(confirmRes.journal).toBeDefined();
    const journalEntries = await LedgerEntry.findAll({
      where: { referenceId: confirmRes.journal.referenceId }
    });
    expect(journalEntries.length).toBeGreaterThanOrEqual(2);

    const debitEntry = journalEntries.find(e => e.type === 'debit');
    const creditEntry = journalEntries.find(e => e.type === 'credit');

    expect(debitEntry?.amount).toBe(2500);
    expect(debitEntry?.walletType).toBe('provider');
    expect(creditEntry?.amount).toBe(2500);
    expect(creditEntry?.walletType).toBe('gateway_fee');
  });

  it('5. يرفض النظام اعتبار التحويل PAID عند وجود عدم تطابق مالي (Reconciliation Mismatch)', async () => {
    const runId = Date.now() + '_' + Math.floor(Math.random() * 100000);
    const providerId = Math.floor(Math.random() * 800000) + 400000;
    const beneficiary = await Beneficiary.create({
      providerId,
      officialName: 'شركة الإبداع الفني',
      commercialRegister: `CR_${runId}`,
      iban: generateValidSaudiIban(providerId),
      bankName: 'البنك السعودي الفرنسي',
      bankCode: 'BSFR',
      kycStatus: 'active',
      verifiedAt: new Date()
    });

    const settlement = await SettlementInstruction.create({
      paymentId: `PAY_MISMATCH_${runId}`,
      providerId,
      beneficiaryId: beneficiary.id,
      instructionNo: `SRV-26-${Math.floor(Math.random() * 8999999999 + 1000000000)}`,
      amount: 100000, // Expected 1,000.00 SAR (100,000 Halalas)
      netPayableAmount: 100000,
      currency: 'SAR',
      eligibleAt: new Date(Date.now() - 3600000),
      status: 'scheduled'
    });

    const createRes = await PayoutOrchestrator.createPayoutInstruction({
      settlementId: settlement.id,
      actor: 'FINANCE_MAKER',
      gatewayName: 'mock_bank'
    });

    const dispatchRes = await PayoutOrchestrator.dispatchPayout(createRes.payout.id, 'FINANCE_OPERATOR');
    const extRef = dispatchRes.payout.externalReference;

    // Simulate Bank returning a mismatched amount (e.g. 80,000 Halalas instead of 100,000)
    const mismatchedPayload = {
      id: `EVT_MISMATCH_${runId}`,
      transaction_reference: extRef,
      status: 'SUCCESS',
      amount: 80000, // 800.00 SAR mismatch!
      currency: 'SAR',
      gateway: 'mock_bank'
    };

    const confirmRes = await PayoutOrchestrator.handleExternalConfirmation(
      extRef,
      mismatchedPayload,
      'SIG_VALID_HASH',
      { 'x-signature': 'SIG_VALID_HASH' },
      { actor: 'WEBHOOK_WORKER' }
    );

    expect(confirmRes.success).toBe(false);
    expect(confirmRes.status).toBe('reconciliation_required');
    expect(confirmRes.reconciliation.matched).toBe(false);
    expect(confirmRes.reconciliation.differenceHalalas).toBe(20000);

    const updatedPayout = await PayoutInstruction.findByPk(createRes.payout.id);
    expect(updatedPayout?.status).toBe('reconciliation_required');
    expect(updatedPayout?.paidAt).toBeNull();

    const updatedSettlement = await SettlementInstruction.findByPk(settlement.id);
    expect(updatedSettlement?.status).toBe('reconciliation_required');
    expect(updatedSettlement?.paidAt).toBeNull();
  });

  it('6. يعالج النظام الحوالات المرتجعة (Returned Payouts) ويعكس القيود المالية ويعيد فتح استحقاق المزود', async () => {
    const runId = Date.now() + '_' + Math.floor(Math.random() * 100000);
    const providerId = Math.floor(Math.random() * 800000) + 500000;
    const beneficiary = await Beneficiary.create({
      providerId,
      officialName: 'استوديو الذكريات للتصوير',
      commercialRegister: `CR_${runId}`,
      iban: generateValidSaudiIban(providerId),
      bankName: 'بنك الجزيرة',
      bankCode: 'BJAZ',
      kycStatus: 'active',
      verifiedAt: new Date()
    });

    const settlement = await SettlementInstruction.create({
      paymentId: `PAY_RETURN_${runId}`,
      providerId,
      beneficiaryId: beneficiary.id,
      instructionNo: `SRV-26-${Math.floor(Math.random() * 8999999999 + 1000000000)}`,
      amount: 150000, // 1,500.00 SAR
      netPayableAmount: 150000,
      currency: 'SAR',
      eligibleAt: new Date(Date.now() - 3600000),
      status: 'scheduled'
    });

    const createRes = await PayoutOrchestrator.createPayoutInstruction({
      settlementId: settlement.id,
      actor: 'FINANCE_MAKER',
      gatewayName: 'mock_bank'
    });

    const dispatchRes = await PayoutOrchestrator.dispatchPayout(createRes.payout.id, 'FINANCE_OPERATOR');
    const extRef = dispatchRes.payout.externalReference;

    // Successfully pay first
    await PayoutOrchestrator.handleExternalConfirmation(
      extRef,
      {
        id: `EVT_PAID_THEN_RETURN_${runId}`,
        transaction_reference: extRef,
        status: 'SUCCESS',
        amount: 150000,
        currency: 'SAR',
        gateway: 'mock_bank'
      },
      'SIG_VALID_HASH',
      { 'x-signature': 'SIG_VALID_HASH' }
    );

    // Later, bank notifies transfer returned due to frozen account
    const returnRes = await PayoutOrchestrator.handleReturnedPayout(
      createRes.payout.id,
      'الحساب البنكي للمستفيد مجمد من قِبل البنك المركزي',
      'BANK_RECON_AGENT'
    );

    expect(returnRes.success).toBe(true);
    expect(returnRes.payout.status).toBe('returned');
    expect(returnRes.settlement.status).toBe('manual_review');
    expect(returnRes.reversalJournal).toBeDefined();

    // Verify reversal journal entries
    const reversalEntries = await LedgerEntry.findAll({
      where: { referenceId: returnRes.reversalJournal.referenceId }
    });
    expect(reversalEntries.length).toBeGreaterThanOrEqual(2);
    const debitClearing = reversalEntries.find(e => e.type === 'debit');
    const creditPayable = reversalEntries.find(e => e.type === 'credit');

    expect(debitClearing?.walletType).toBe('gateway_fee');
    expect(creditPayable?.walletType).toBe('provider');
  });

  it('7. يمنع نظام الاعتماد المزدوج (Maker-Checker) نفس المستخدم من طلب واعتماد أمر الصرف الخاص به', async () => {
    const runId = Date.now() + '_' + Math.floor(Math.random() * 100000);
    const providerId = Math.floor(Math.random() * 800000) + 600000;
    const beneficiary = await Beneficiary.create({
      providerId,
      officialName: 'قاعة القصر الملكي',
      commercialRegister: `CR_${runId}`,
      iban: generateValidSaudiIban(providerId),
      bankName: 'مصرف الإنماء',
      bankCode: 'INMA',
      kycStatus: 'active',
      verifiedAt: new Date()
    });

    const settlement = await SettlementInstruction.create({
      paymentId: `PAY_DUAL_AUTH_${runId}`,
      providerId,
      beneficiaryId: beneficiary.id,
      instructionNo: `SRV-26-${Math.floor(Math.random() * 8999999999 + 1000000000)}`,
      amount: 1000000, // 10,000.00 SAR
      netPayableAmount: 1000000,
      currency: 'SAR',
      eligibleAt: new Date(Date.now() - 3600000),
      status: 'scheduled'
    });

    const createRes = await PayoutOrchestrator.createPayoutInstruction({
      settlementId: settlement.id,
      actor: 'MAKER_AHMED',
      gatewayName: 'mock_bank',
      requiresDualApproval: true
    });

    // Ahmed cannot approve his own payout
    await expect(
      PayoutOrchestrator.approveDualAuthorization(createRes.payout.id, 'MAKER_AHMED')
    ).rejects.toThrow(/Maker-Checker Violation/);

    // Checker Khalid CAN approve
    const approveRes = await PayoutOrchestrator.approveDualAuthorization(createRes.payout.id, 'CHECKER_KHALID');
    expect(approveRes.success).toBe(true);

    const payout = await PayoutInstruction.findByPk(createRes.payout.id);
    expect((payout?.dualApproval as any)?.approvedBy).toBe('CHECKER_KHALID');
  });
});
