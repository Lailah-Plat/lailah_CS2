import { IFinanceRepository } from '../finance.repository.js';
import { Op } from 'sequelize';
import { UnifiedPaymentsEngine } from '../../../services/payment/UnifiedPaymentsEngine.js';

export class ReleaseFundsUseCase {
  constructor(private financeRepository: IFinanceRepository) {}

  async execute(body: any) {
    const { providerId, bookingId } = body;
    const numericProviderId = providerId ? Number(providerId) : null;
    const numericBookingId = bookingId ? Number(bookingId) : 0;
    
    const wallet = await this.financeRepository.findWalletByProvider(numericProviderId!);
    if (!wallet) {
      throw new Error('المحفظة غير موجودة');
    }

    // 1. Release held escrow in Unified Payments Engine
    let unifiedRelease = null;
    if (numericBookingId) {
      try {
        unifiedRelease = await UnifiedPaymentsEngine.releaseHeldProviderFunds(numericBookingId);
      } catch (err) {
        console.warn('UnifiedPaymentsEngine releaseHeldProviderFunds error/warning:', err);
      }
    }

    // 2. Also release legacy pending transaction if present
    const tx = await this.financeRepository.findTransaction({
      providerId: numericProviderId,
      type: 'deposit_pending',
      status: 'pending',
      description: { [Op.like]: `%#${bookingId}%` }
    });

    if (tx) {
      const releaseAmount = tx.amount;
      wallet.pendingBalance = Math.max(0, (wallet.pendingBalance || 0) - releaseAmount);
      wallet.balance = (wallet.balance || 0) + releaseAmount;
      await wallet.save();

      tx.status = 'completed';
      tx.type = 'release_deposit';
      tx.description = `تحرير مبلغ حجز #${bookingId} إلى الرصيد المتاح`;
      await tx.save();

      return { wallet, tx, unifiedRelease };
    }

    if (unifiedRelease && unifiedRelease.releasedCount > 0) {
      const reloadedWallet = await this.financeRepository.findWalletByProvider(numericProviderId!);
      return { wallet: reloadedWallet, unifiedRelease };
    }

    throw new Error('لم يتم العثور على مبالغ معلقة قابلة للتحرير لهذا الحجز.');
  }
}
