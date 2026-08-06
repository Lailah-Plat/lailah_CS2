import { IFinanceRepository } from "../../modules/finance/finance.repository.js";

export class WalletService {
  /**
   * Safe-deposits a pending amount to a provider's wallet.
   */
  static async depositPending(
    financeRepository: IFinanceRepository,
    providerId: number,
    amount: number,
    bookingId: any,
    description?: string,
    options?: any
  ) {
    const [wallet] = await financeRepository.findOrCreateWallet(providerId, options);
    wallet.pendingBalance += amount;
    await wallet.save(options);

    const desc = description || `إيداع معلق لحجز #${bookingId} (بانتظار اتمام المغادرة)`;

    await financeRepository.createTransaction({
      providerId,
      type: "deposit_pending",
      description: desc,
      amount,
      status: "pending",
    }, options);

    return wallet;
  }

  /**
   * Releases pending balance into actual available balance.
   */
  static async releasePendingToAvailable(
    financeRepository: IFinanceRepository,
    providerId: number,
    amount: number,
    description?: string,
    options?: any
  ) {
    const [wallet] = await financeRepository.findOrCreateWallet(providerId, options);
    if (wallet.pendingBalance < amount) {
      throw new Error("Insufficient pending balance to release");
    }
    wallet.pendingBalance -= amount;
    wallet.balance += amount;
    await wallet.save(options);

    await financeRepository.createTransaction({
      providerId,
      type: "release_escrow",
      description: description || "تحويل الرصيد المعلق إلى الرصيد المتاح",
      amount,
      status: "completed",
    }, options);

    return wallet;
  }
}
