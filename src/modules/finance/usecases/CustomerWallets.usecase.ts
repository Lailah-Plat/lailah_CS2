import { IFinanceRepository } from '../finance.repository.js';
import { RefundService } from '../../../services/finance/RefundService.js';

export class FetchAndReconcileCustomerWalletsUseCase {

  constructor(private financeRepository: IFinanceRepository) {}

  async execute() {
    const wallets = await this.financeRepository.findCustomerWallets();
    const heldBalances = await this.financeRepository.findCustomerHeldBalances();

    const now = new Date();
    let updatedAny = false;

    for (const hb of heldBalances) {
      if (hb.conversionStatus === 'held') {
        const heldSinceDate = hb.heldSince ? new Date(hb.heldSince) : new Date();
        const diffMs = now.getTime() - heldSinceDate.getTime();
        const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.4375);

        // Auto convert after 24 months (24m auto-convert rule)
        if (diffMonths >= 24) {
          hb.conversionStatus = 'converted_to_cash';
          hb.approvedByAdmin = 'System (Auto-Convert 24M)';
          hb.notes = (hb.notes || '') + ' | تحويل تلقائي للرصيد بعد 24 شهراً إلى نقد مسحوب.';
          await hb.save();

          const [wallet] = await this.financeRepository.findOrCreateCustomerWallet(hb.customerEmail, {
            customerName: hb.customerName || 'عميل منصة ليلة',
            cashBalance: 0
          });
          wallet.cashBalance += hb.amount;
          await wallet.save();

          updatedAny = true;
        }
      }
    }

    const finalWallets = updatedAny ? await this.financeRepository.findCustomerWallets() : wallets;
    const finalHeldBalances = updatedAny ? await this.financeRepository.findCustomerHeldBalances() : heldBalances;

    return {
      success: true,
      wallets: finalWallets,
      heldBalances: finalHeldBalances
    };
  }
}

export class ConvertForceMajeureBalanceUseCase {
  constructor(private financeRepository: IFinanceRepository) {}

  async execute(body: any) {
    const { id, approvedBy } = body;
    if (!id) {
      throw new Error('معرف السجل المحجوز مطلوب');
    }

    const { heldBalance, wallet } = await RefundService.convertForceMajeureBalance(
      this.financeRepository,
      Number(id),
      approvedBy || 'إدارة العمليات العليا بموافقة رسمية'
    );

    return {
      success: true,
      message: `تم تحويل مبلغ القوة القاهرة بالكامل [${heldBalance.amount} ر.س] إلى المحفظة النقدية بنجاح ومباشرة دون رسوم تحويل.`,
      heldBalance,
      wallet
    };
  }
}

export class IssueCreditUseCase {
  constructor(private financeRepository: IFinanceRepository) {}

  async execute(body: any) {
    const { customerEmail, customerName, amount, holdReason, heldSinceDaysAgo } = body;
    if (!customerEmail || !amount) {
      throw new Error('البريد الإلكتروني والمبلغ مطلوبين لتهيئة السجل');
    }

    const heldSince = new Date();
    if (heldSinceDaysAgo) {
      heldSince.setDate(heldSince.getDate() - Number(heldSinceDaysAgo));
    }

    const hb = await this.financeRepository.createCustomerHeldBalance({
      customerEmail,
      customerName: customerName || 'عميل تجريبي',
      amount: Number(amount),
      holdReason: holdReason || 'force_majeure',
      heldSince,
      conversionStatus: 'held',
      notes: `رصيد مالي تجريبي مضاف للتجربة والاختيار الفعلي في التطبيق لوظيفة القوة القاهرة والجدولة.`
    });

    return {
      success: true,
      heldBalance: hb
    };
  }
}
