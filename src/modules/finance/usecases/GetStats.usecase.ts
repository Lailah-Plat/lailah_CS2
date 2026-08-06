import { IFinanceRepository } from '../finance.repository.js';
import { generateRevenueNumber, generateInvoiceNumber } from './GenerateId.js';
import { Op } from 'sequelize';

export class GetStatsUseCase {
  constructor(private financeRepository: IFinanceRepository) {}

  private async syncBookingsAndRequestsToFinance() {
    try {
      const bookings = await this.financeRepository.findBookings();
      const halls = await this.financeRepository.findHalls();
      const hallProviderMap = new Map<number, number>();
      for (const h of halls) {
        if (h.id && h.providerId) {
          hallProviderMap.set(h.id, h.providerId);
        }
      }

      const existingRevenues = await this.financeRepository.findRevenues();
      const existingBookingIds = new Set(
        existingRevenues
          .filter(r => r.bookingId)
          .map(r => String(r.bookingId))
      );

      // Sync bookings
      for (const b of bookings) {
        const isPaidOrConfirmedOrCompleted = 
          b.paymentStatus === 'paid' || 
          b.status === 'confirmed' || 
          b.status === 'completed';

        if (isPaidOrConfirmedOrCompleted && !existingBookingIds.has(String(b.id))) {
          const providerId = hallProviderMap.get(b.hallId) || null;
          
          const bookingAmount = b.totalAmount || 0;
          const baseAmount = bookingAmount / 1.15;
          const bookingVatAmount = bookingAmount - baseAmount;

          const commissionPercentage = 0.10;
          const commissionBase = baseAmount * commissionPercentage;
          const commissionVat = commissionBase * 0.15;
          const commissionTotal = commissionBase + commissionVat;

          const providerDue = bookingAmount - commissionTotal;

          const revNumComm = await generateRevenueNumber();
          await this.financeRepository.createRevenue({
            revenueNumber: revNumComm,
            title: `عمولة من حجز #${b.id}`,
            type: 'commission',
            amount: commissionBase,
            vatAmount: commissionVat,
            amountIncludingVat: commissionTotal,
            bookingId: String(b.id),
            providerId: providerId,
            paymentMethod: b.paymentMethod || 'mada',
          });

          const revNumTotal = await generateRevenueNumber();
          await this.financeRepository.createRevenue({
            revenueNumber: revNumTotal,
            title: `إيراد حجز قاعة #${b.id}`,
            type: 'حجز',
            amount: baseAmount,
            vatAmount: bookingVatAmount,
            amountIncludingVat: bookingAmount,
            bookingId: String(b.id),
            providerId: providerId,
            paymentMethod: b.paymentMethod || 'mada',
          });

          const invExists = await this.financeRepository.findInvoiceByBookingId(b.id);
          if (!invExists) {
            const invNum = await generateInvoiceNumber();
            await this.financeRepository.createInvoice({
              invoiceNumber: invNum,
              customerId: b.userId || null,
              providerId: providerId,
              bookingId: b.id,
              totalAmount: bookingAmount,
              vatAmount: bookingVatAmount,
              status: 'paid',
            });
          }

          if (providerId) {
            try {
              const numProviderId = Number(providerId);
              const claimExists = await this.financeRepository.findClaimByProviderAndAmount(numProviderId, providerDue);
              if (!claimExists) {
                await this.financeRepository.createClaim({
                  providerId: numProviderId,
                  amount: providerDue,
                  status: 'pending',
                  bankDetails: 'Pending bank update',
                });
              }

              const [wallet] = await this.financeRepository.findOrCreateWallet(numProviderId);
              if (wallet && wallet.save) {
                wallet.pendingBalance += providerDue;
                await wallet.save().catch(err => console.warn('Wallet save warning:', err));
              }

              await this.financeRepository.createTransaction({
                providerId: numProviderId,
                amount: providerDue,
                type: 'deposit_pending',
                status: 'pending',
                description: `مستحقات معلقة لحجز #${b.id}`,
                date: new Date().toISOString()
              }).catch(err => console.warn('Create transaction warning:', err));
            } catch (pErr) {
              console.warn('Provider sync warning for booking:', b.id, pErr);
            }
          }
        }
      }

      // Sync support service requests
      const serviceRequests = await this.financeRepository.findSupportServiceRequests();
      const existingServiceReqRevenues = new Set(
        existingRevenues
          .filter(r => r.title && r.title.includes('خدمة مساندة #'))
          .map(r => {
            const match = r.title.match(/#(\d+)/);
            return match ? match[1] : '';
          })
          .filter(id => id !== '')
      );

      for (const sr of serviceRequests) {
        const isCompleted = sr.status === 'مكتمل' || sr.status === 'تم الاعتماد' || sr.status === 'approved' || sr.status === 'completed';
        if (isCompleted && !existingServiceReqRevenues.has(String(sr.id))) {
          const amount = sr.price || 0;
          const baseAmount = amount / 1.15;
          const vatAmount = amount - baseAmount;
          const numProviderId = sr.providerId ? Number(sr.providerId) : null;

          const revNum = await generateRevenueNumber();
          await this.financeRepository.createRevenue({
            revenueNumber: revNum,
            title: `إيراد خدمة مساندة #${sr.id} - ${sr.serviceName}`,
            type: 'خدمة',
            amount: baseAmount,
            vatAmount: vatAmount,
            amountIncludingVat: amount,
            providerId: numProviderId,
            paymentMethod: 'credit_card',
          });

          if (numProviderId && !isNaN(numProviderId)) {
            try {
              const [wallet] = await this.financeRepository.findOrCreateWallet(numProviderId);
              if (wallet && wallet.save) {
                wallet.balance += amount;
                await wallet.save().catch(err => console.warn('Wallet save warning:', err));
              }

              await this.financeRepository.createTransaction({
                providerId: numProviderId,
                amount: amount,
                type: 'deposit_ready',
                status: 'completed',
                description: `مستحقات خدمة مساندة #${sr.id}`,
                date: new Date().toISOString()
              }).catch(err => console.warn('Create transaction warning:', err));
            } catch (srErr) {
              console.warn('Provider sync warning for support service request:', sr.id, srErr);
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to sync bookings to finance:', err);
    }
  }

  async execute(role: string, providerId: number | null) {
    await this.syncBookingsAndRequestsToFinance();

    let queryRevenues: any[] = [];
    let queryExpenses: any[] = [];
    let queryInvoices: any[] = [];
    let queryClaims: any[] = [];
    let queryWallet: any = { balance: 0, pendingBalance: 0 };
    let queryTransactions: any[] = [];
    let dbSummary: any = null;

    if (role === 'admin') {
      queryRevenues = await this.financeRepository.findRevenues();
      queryExpenses = await this.financeRepository.findExpenses();
      queryInvoices = await this.financeRepository.findInvoices();
      queryClaims = await this.financeRepository.findClaims();
      queryTransactions = await this.financeRepository.findTransactions();
      
      const wallets = await this.financeRepository.findWallets();
      for (const w of wallets) {
        queryWallet.balance += w.balance;
        queryWallet.pendingBalance += w.pendingBalance;
      }

      const totalEntitlements = queryWallet.balance + queryWallet.pendingBalance;
      const netBookingProfit = await this.financeRepository.sumClaims('amount', {
        status: { [Op.ne]: 'rejected' }
      });
      const totalInflow = await this.financeRepository.sumTransactions('amount', {
        amount: { [Op.gt]: 0 }
      });
      const totalOutflow = Math.abs(await this.financeRepository.sumTransactions('amount', {
        amount: { [Op.lt]: 0 }
      }));

      dbSummary = {
        totalEntitlements,
        netBookingProfit,
        totalInflow,
        totalOutflow
      };
    } else if (providerId) {
      const numProviderId = Number(providerId);
      queryRevenues = await this.financeRepository.findRevenues({ providerId: numProviderId });
      queryExpenses = await this.financeRepository.findExpenses({
        [Op.or]: [
          { providerId: numProviderId },
          { category: String(providerId) }
        ]
      });
      queryInvoices = await this.financeRepository.findInvoices({ providerId: numProviderId });
      queryClaims = await this.financeRepository.findClaims({ providerId: numProviderId });
      
      const [w] = await this.financeRepository.findOrCreateWallet(numProviderId);
      queryWallet = { balance: w.balance, pendingBalance: w.pendingBalance };
      
      queryTransactions = await this.financeRepository.findTransactions({ providerId: numProviderId });

      const totalEntitlements = w.balance + w.pendingBalance;
      const netBookingProfit = await this.financeRepository.sumClaims('amount', {
        providerId: numProviderId,
        status: { [Op.ne]: 'rejected' }
      });
      const totalInflow = await this.financeRepository.sumTransactions('amount', {
        providerId: numProviderId,
        amount: { [Op.gt]: 0 }
      });
      const totalOutflow = Math.abs(await this.financeRepository.sumTransactions('amount', {
        providerId: numProviderId,
        amount: { [Op.lt]: 0 }
      }));

      dbSummary = {
        totalEntitlements,
        netBookingProfit,
        totalInflow,
        totalOutflow
      };
    }

    return {
      revenues: queryRevenues,
      expenses: queryExpenses,
      invoices: queryInvoices,
      claims: queryClaims,
      wallet: queryWallet,
      walletTransactions: queryTransactions,
      summary: dbSummary
    };
  }
}
