import { IFinanceRepository } from '../finance.repository.js';
import { Op } from 'sequelize';

export class TriggerCronUseCase {
  constructor(private financeRepository: IFinanceRepository) {}

  async execute() {
    const fortyEightHoursAgo = new Date();
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

    const pendingTxList = await this.financeRepository.findTransactions({
      type: 'deposit_pending',
      status: 'pending',
      createdAt: { [Op.lte]: fortyEightHoursAgo }
    });

    let count = 0;
    for (const tx of pendingTxList) {
      const providerId = tx.providerId;
      const amount = tx.amount;

      const wallet = await this.financeRepository.findWalletByProvider(providerId);
      if (wallet) {
        wallet.pendingBalance = Math.max(0, wallet.pendingBalance - amount);
        wallet.balance += amount;
        await wallet.save();

        tx.status = 'completed';
        tx.type = 'release_deposit';
        tx.description += ' (تحرير تلقائي للمستحقات بعد مرور 48 ساعة)';
        await tx.save();
        count++;
      }
    }

    return { processedCount: count };
  }
}
