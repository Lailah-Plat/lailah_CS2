import { IFinanceRepository } from '../finance.repository.js';

export class SettleClaimUseCase {
  constructor(private financeRepository: IFinanceRepository) {}

  async execute(body: any) {
    const { claimId, action, receiptUrl } = body;
    const claim = await this.financeRepository.findClaimByPk(claimId);
    if (!claim) {
      throw new Error('لم يتم العثور على طلب التسوية');
    }

    if (claim.status !== 'pending') {
      throw new Error('تمت معالجة هذا الطلب مسبقاً.');
    }

    const providerId = claim.providerId;
    const wallet = await this.financeRepository.findWalletByProvider(Number(providerId));

    if (action === 'approve') {
      claim.status = 'paid';
      await claim.save();

      const tx = await this.financeRepository.findTransaction({
        providerId: Number(providerId),
        type: 'withdrawal',
        status: 'pending',
        amount: -claim.amount
      });
      if (tx) {
        tx.status = 'completed';
        if (receiptUrl) {
          tx.description += ` - رقم السداد/التحويل: ${receiptUrl}`;
        }
        await tx.save();
      }
    } else {
      claim.status = 'rejected';
      await claim.save();

      if (wallet) {
        wallet.balance += claim.amount;
        await wallet.save();
      }

      const tx = await this.financeRepository.findTransaction({
        providerId: Number(providerId),
        type: 'withdrawal',
        status: 'pending',
        amount: -claim.amount
      });
      if (tx) {
        tx.status = 'failed';
        tx.description += ' (تم رفض الطلب وإعادة المبلغ للمحفظة المتاحة)';
        await tx.save();
      }
    }

    return claim;
  }
}
