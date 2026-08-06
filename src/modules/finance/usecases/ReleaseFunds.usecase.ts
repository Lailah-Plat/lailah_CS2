import { IFinanceRepository } from '../finance.repository.js';
import { Op } from 'sequelize';

export class ReleaseFundsUseCase {
  constructor(private financeRepository: IFinanceRepository) {}

  async execute(body: any) {
    const { providerId, bookingId } = body;
    const numericProviderId = providerId ? Number(providerId) : null;
    
    const wallet = await this.financeRepository.findWalletByProvider(numericProviderId!);
    if (!wallet) {
      throw new Error('المحفظة غير موجودة');
    }

    const tx = await this.financeRepository.findTransaction({
      providerId: numericProviderId,
      type: 'deposit_pending',
      status: 'pending',
      description: { [Op.like]: `%#${bookingId}%` }
    });

    if (tx) {
      const releaseAmount = tx.amount;
      wallet.pendingBalance = Math.max(0, wallet.pendingBalance - releaseAmount);
      wallet.balance += releaseAmount;
      await wallet.save();

      tx.status = 'completed';
      tx.type = 'release_deposit';
      tx.description = `تحرير مبلغ حجز #${bookingId} إلى الرصيد المتاح`;
      await tx.save();

      return { wallet, tx };
    }

    throw new Error('لم يتم العثور على مبالغ معلقة قابلة للتحرير لهذا الحجز.');
  }
}
