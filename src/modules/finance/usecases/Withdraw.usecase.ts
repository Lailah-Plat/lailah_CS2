import { IFinanceRepository } from '../finance.repository.js';
import { FinancialEngine } from '../../../services/finance/FinancialEngine.js';
import { sequelize } from '../../../models/Database.js';

export class WithdrawUseCase {
  constructor(private financeRepository: IFinanceRepository) {}

  async execute(body: any) {
    const { providerId, amount, bankDetails } = body;
    const requestedAmount = Number(amount);
    const numericProviderId = providerId ? Number(providerId) : null;

    if (!numericProviderId) {
      throw new Error('مطلوب معرف المزود لإرسال الطلب');
    }

    const wallet = await this.financeRepository.findWalletByProvider(numericProviderId);
    if (!wallet || wallet.balance < requestedAmount) {
      throw new Error('الرصيد المتاح غير كافٍ لإتمام عملية السحب.');
    }

    const result = await sequelize.transaction(async (t) => {
      const claim = await this.financeRepository.createClaim({
        providerId: numericProviderId,
        amount: requestedAmount,
        status: 'pending',
        bankDetails: bankDetails || 'معلومات التحويل المرفقة'
      }, { transaction: t });

      await FinancialEngine.postLedgerEntry({
        walletType: "provider",
        providerId: numericProviderId,
        referenceId: String(claim.id),
        referenceType: "withdrawal",
        type: "debit",
        amount: requestedAmount,
        description: `طلب سحب رصيد متاح (${requestedAmount} ريال)`,
        status: "pending"
      }, { transaction: t });

      const updatedWallet = await this.financeRepository.findWalletByProvider(numericProviderId, { transaction: t });

      return { success: true, claim, wallet: updatedWallet };
    });

    return result;
  }
}
