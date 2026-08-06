import { IFinanceRepository } from '../finance.repository.js';
import { generateRevenueNumber } from './GenerateId.js';
import { TaxService } from '../../../services/finance/TaxService.js';
import { CommissionService } from '../../../services/finance/CommissionService.js';
import { InvoiceService } from '../../../services/finance/InvoiceService.js';
import { WalletService } from '../../../services/finance/WalletService.js';
import { sequelize } from '../../../models/Database.js';
import { Logger } from '../../../services/logger.service.js';
import { FinancialEngine } from '../../../services/finance/FinancialEngine.js';

export class CompleteBookingUseCase {
  constructor(private financeRepository: IFinanceRepository) {}

  async execute(body: any) {
    const { bookingId, amount, providerId, customerId, commissionRate, paymentMethod } = body;
    
    const rate = Number(commissionRate ?? 10) / 100;
    const totalWithVat = Number(amount);

    // Calculate with the central FinancialEngine
    const calc = FinancialEngine.calculate({
      grossAmount: totalWithVat,
      commissionRate: rate,
    });

    const bookingVatAmount = TaxService.calculateVatFromTotal(totalWithVat);
    const numericProviderId = providerId ? Number(providerId) : null;

    Logger.financial("Initiating Complete Booking Transaction via FinancialEngine", { bookingId, totalWithVat });

    // Execute everything inside a transaction to ensure complete atomicity (Atomic consistency)
    const result = await sequelize.transaction(async (transaction) => {
      // 1. Post platform revenue and platform VAT ledger entries
      await FinancialEngine.postLedgerEntry({
        walletType: 'platform_revenue',
        providerId: null,
        referenceId: String(bookingId),
        referenceType: 'booking',
        type: 'credit',
        amount: calc.commissionBase,
        description: `إيراد عمولة حجز #${bookingId}`,
      }, { transaction });

      await FinancialEngine.postLedgerEntry({
        walletType: 'platform_vat',
        providerId: null,
        referenceId: String(bookingId),
        referenceType: 'booking',
        type: 'credit',
        amount: calc.commissionVat,
        description: `ضريبة القيمة المضافة لعمولة حجز #${bookingId}`,
      }, { transaction });

      // 2. Create Settlement Record (Financial Snapshot)
      if (numericProviderId) {
        await FinancialEngine.createSettlement({
          referenceId: String(bookingId),
          referenceType: 'booking',
          providerId: numericProviderId,
          grossAmount: totalWithVat,
          commissionRate: rate,
        }, { transaction });

        // 3. Update Provider Pending Balance with Ledger Entry
        await FinancialEngine.updateProviderPendingBalance({
          providerId: numericProviderId,
          amount: calc.providerShare,
          referenceId: String(bookingId),
          referenceType: 'booking',
          type: 'credit',
          description: `إيداع معلق لحجز #${bookingId}`,
        }, { transaction });
      }

      // 4. Create standard Revenue log for reporting backwards-compatibility
      const revNum = await generateRevenueNumber();
      await this.financeRepository.createRevenue({
        revenueNumber: revNum,
        title: `عمولة من حجز #${bookingId}`,
        type: 'commission',
        amount: calc.commissionBase,
        vatAmount: calc.commissionVat,
        amountIncludingVat: calc.commissionAmount,
        bookingId,
        providerId: numericProviderId,
        paymentMethod: paymentMethod || 'mada'
      }, { transaction });

      // 5. Delegate Invoice creation to InvoiceService
      await InvoiceService.createInvoice(
        this.financeRepository,
        bookingId,
        customerId,
        totalWithVat,
        bookingVatAmount,
        'paid',
        { transaction }
      );

      return { providerDue: calc.providerShare, commissionTotal: calc.commissionAmount };
    });

    Logger.financial("Complete Booking Transaction Committed successfully", { bookingId, ...result });
    return { success: true, ...result };
  }
}


