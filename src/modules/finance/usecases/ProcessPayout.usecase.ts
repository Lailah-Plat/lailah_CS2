import { IFinanceRepository } from '../finance.repository.js';
import { SettlementInstruction, PayoutInstruction, Beneficiary } from '../../../models/Database.js';
import { PayoutOrchestrator } from '../../../services/payout/PayoutOrchestrator.js';

export class ProcessPayoutUseCase {
  constructor(private financeRepository: IFinanceRepository) {}

  async execute(body: any) {
    const { claimId, settlementId, payoutId, gateway, actor = 'FINANCE_ADMIN' } = body;
    const selectedGateway = gateway || 'hyperpay';

    // Path A: If payoutId directly provided
    if (payoutId) {
      const dispatchResult = await PayoutOrchestrator.dispatchPayout(payoutId, actor);
      return dispatchResult;
    }

    // Path B: If settlementId provided
    if (settlementId) {
      const createRes = await PayoutOrchestrator.createPayoutInstruction({
        settlementId,
        actor,
        gatewayName: selectedGateway
      });
      const dispatchRes = await PayoutOrchestrator.dispatchPayout(createRes.payout.id, actor);
      return {
        ...dispatchRes,
        payoutInstruction: createRes.payout,
        snapshot: createRes.snapshot
      };
    }

    // Path C: If legacy claimId provided
    if (!claimId) {
      throw new Error('يرجى تقديم معرف طلب التسوية (claimId) أو معرف الاستحقاق (settlementId).');
    }

    const claim = await this.financeRepository.findClaimByPk(claimId);
    if (!claim) {
      throw new Error('طلب التسوية غير موجود لتسديده.');
    }

    if (claim.status === 'paid') {
      return {
        success: true,
        alreadyPaid: true,
        claim,
        message: 'تم سداد هذا الطلب مسبقاً وتأكيد مقاصته البنكية.'
      };
    }

    // 1. Find or create matching SettlementInstruction
    let settlement = await SettlementInstruction.findOne({
      where: { providerId: claim.providerId, status: ['pending_eligibility', 'eligible', 'scheduled', 'release_requested', 'on_hold', 'draft'] }
    });

    if (!settlement) {
      // Find Beneficiary
      let beneficiary = await Beneficiary.findOne({ where: { providerId: claim.providerId } });
      if (!beneficiary) {
        beneficiary = await Beneficiary.create({
          providerId: claim.providerId,
          officialName: `مزود معتمد #${claim.providerId}`,
          commercialRegister: '1010000000',
          iban: claim.bankDetails || 'SA9380000000003829482710',
          bankName: 'البنك الأهلي السعودي',
          bankCode: 'SA',
          kycStatus: 'active',
          verifiedAt: new Date()
        });
      }

      settlement = await SettlementInstruction.create({
        paymentId: `CLAIM_${claim.id}`,
        providerId: claim.providerId,
        beneficiaryId: beneficiary.id,
        instructionNo: `SRV-${new Date().getFullYear().toString().slice(-2)}-${String(claim.id).padStart(10, '0')}`,
        amount: Math.round(Number(claim.amount) * 100),
        netPayableAmount: Math.round(Number(claim.amount) * 100),
        currency: 'SAR',
        eligibleAt: new Date(),
        status: 'scheduled'
      });
    }

    // 2. Create Payout Instruction with immutable Financial Snapshot
    const payoutResult = await PayoutOrchestrator.createPayoutInstruction({
      settlementId: settlement.id,
      actor,
      gatewayName: selectedGateway
    });

    // 3. Dispatch to External Payout Rail
    const dispatchResult = await PayoutOrchestrator.dispatchPayout(payoutResult.payout.id, actor);

    // 4. Update Legacy Claim State to 'processing' (NOT instant paid)
    claim.status = 'processing';
    (claim as any).transactionReference = dispatchResult.payout.externalReference || dispatchResult.payout.payoutNo;
    (claim as any).gateway = selectedGateway;
    (claim as any).dispatchedAt = new Date();
    await claim.save();

    return {
      success: true,
      lifecycleStage: 'Processing_Awaiting_Verified_Webhook',
      claim,
      payout: dispatchResult.payout,
      settlement,
      status: 'processing',
      gateway: selectedGateway,
      transactionId: dispatchResult.payout.externalReference || dispatchResult.payout.payoutNo,
      snapshot: payoutResult.snapshot,
      message: 'تم إنشاء أمر الصرف وإرساله بنجاح إلى شبكة (سريع / SAMA) وهو قيد المعالجة (Processing)؛ وسيتحول إلى (مسدد Paid) فقط بعد استلام وتدقيق الإشعار الخارجي المؤكد والمطابقة المحاسبية.'
    };
  }
}

