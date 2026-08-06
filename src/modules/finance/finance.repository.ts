import { Op } from 'sequelize';
import { Wallet, WalletTransaction, Revenue, RevenueType, Expense, Invoice, FinancialClaim, CustomerWallet, CustomerHeldBalance, ExpenseCategory } from '../../models/Database.js';
import { Booking, Hall, SupportServiceRequest } from '../../models/BookingModels.js';
import { ProviderSubscription } from '../../models/SubscriptionModels.js';

export interface IFinanceRepository {
  findBookings(): Promise<Booking[]>;
  findHalls(): Promise<Hall[]>;
  findRevenues(where?: any): Promise<Revenue[]>;
  createRevenue(data: any, options?: any): Promise<Revenue>;
  findRevenueTypes(): Promise<RevenueType[]>;
  findRevenueTypeByPk(id: any): Promise<RevenueType | null>;
  createRevenueType(data: any, options?: any): Promise<RevenueType>;
  
  findExpenses(where?: any): Promise<Expense[]>;
  createExpense(data: any, options?: any): Promise<Expense>;
  findExpenseCategories(): Promise<ExpenseCategory[]>;
  findExpenseCategoryByPk(id: any): Promise<ExpenseCategory | null>;
  createExpenseCategory(data: any, options?: any): Promise<ExpenseCategory>;

  findInvoices(where?: any): Promise<Invoice[]>;
  findInvoiceByBookingId(bookingId: any): Promise<Invoice | null>;
  createInvoice(data: any, options?: any): Promise<Invoice>;

  findClaims(where?: any): Promise<FinancialClaim[]>;
  findClaimByPk(id: any): Promise<FinancialClaim | null>;
  createClaim(data: any, options?: any): Promise<FinancialClaim>;
  findClaimByProviderAndAmount(providerId: any, amount: number): Promise<FinancialClaim | null>;

  findWallets(): Promise<Wallet[]>;
  findWalletByProvider(providerId: number, options?: any): Promise<Wallet | null>;
  findOrCreateWallet(providerId: number, options?: any): Promise<[Wallet, boolean]>;

  findTransactions(where?: any): Promise<WalletTransaction[]>;
  findTransaction(where: any): Promise<WalletTransaction | null>;
  createTransaction(data: any, options?: any): Promise<WalletTransaction>;

  findSupportServiceRequests(): Promise<SupportServiceRequest[]>;
  findActiveSubscription(email: string): Promise<ProviderSubscription | null>;

  findCustomerWallets(): Promise<CustomerWallet[]>;
  findCustomerWallet(email: string): Promise<CustomerWallet | null>;
  findOrCreateCustomerWallet(email: string, defaults: any, options?: any): Promise<[CustomerWallet, boolean]>;

  findCustomerHeldBalances(where?: any): Promise<CustomerHeldBalance[]>;
  findCustomerHeldBalanceByPk(id: any): Promise<CustomerHeldBalance | null>;
  createCustomerHeldBalance(data: any, options?: any): Promise<CustomerHeldBalance>;

  sumClaims(column: string, where?: any): Promise<number>;
  sumTransactions(column: string, where?: any): Promise<number>;
}

export class SequelizeFinanceRepository implements IFinanceRepository {
  async findBookings(): Promise<Booking[]> {
    return Booking.findAll();
  }

  async findHalls(): Promise<Hall[]> {
    return Hall.findAll();
  }

  async findRevenues(where?: any): Promise<Revenue[]> {
    try {
      return await Revenue.findAll({
        ...(where ? { where } : {}),
        order: [['createdAt', 'DESC']]
      });
    } catch (err) {
      if (where && where.providerId !== undefined) {
        try {
          const altWhere = { ...where, providerId: String(where.providerId) };
          return await Revenue.findAll({
            where: altWhere,
            order: [['createdAt', 'DESC']]
          });
        } catch (e) {
          return [];
        }
      }
      return [];
    }
  }

  async createRevenue(data: any, options?: any): Promise<Revenue> {
    return (await Revenue.create(data, options)) as Revenue;
  }

  async findRevenueTypes(): Promise<RevenueType[]> {
    return RevenueType.findAll({ order: [['isSystem', 'DESC'], ['id', 'ASC']] });
  }

  async findRevenueTypeByPk(id: any): Promise<RevenueType | null> {
    return RevenueType.findByPk(id);
  }

  async createRevenueType(data: any, options?: any): Promise<RevenueType> {
    return (await RevenueType.create(data, options)) as RevenueType;
  }

  async findExpenses(where?: any): Promise<Expense[]> {
    try {
      return await Expense.findAll({
        ...(where ? { where } : {}),
        order: [['createdAt', 'DESC']]
      });
    } catch (err) {
      if (where && where.providerId !== undefined) {
        try {
          const altWhere = { ...where, providerId: String(where.providerId) };
          return await Expense.findAll({
            where: altWhere,
            order: [['createdAt', 'DESC']]
          });
        } catch (e) {
          return [];
        }
      }
      return [];
    }
  }

  async createExpense(data: any, options?: any): Promise<Expense> {
    return (await Expense.create(data, options)) as Expense;
  }

  async findExpenseCategories(): Promise<ExpenseCategory[]> {
    return ExpenseCategory.findAll({ order: [['isSystem', 'DESC'], ['id', 'ASC']] });
  }

  async findExpenseCategoryByPk(id: any): Promise<ExpenseCategory | null> {
    return ExpenseCategory.findByPk(id);
  }

  async createExpenseCategory(data: any, options?: any): Promise<ExpenseCategory> {
    return (await ExpenseCategory.create(data, options)) as ExpenseCategory;
  }

  async findInvoices(where?: any): Promise<Invoice[]> {
    try {
      return await Invoice.findAll({
        ...(where ? { where } : {}),
        order: [['createdAt', 'DESC']]
      });
    } catch (err) {
      if (where && where.providerId !== undefined) {
        try {
          const altWhere = { ...where, providerId: String(where.providerId) };
          return await Invoice.findAll({
            where: altWhere,
            order: [['createdAt', 'DESC']]
          });
        } catch (e) {
          return [];
        }
      }
      return [];
    }
  }

  async findInvoiceByBookingId(bookingId: any): Promise<Invoice | null> {
    const numBookingId = typeof bookingId === 'string' ? parseInt(bookingId, 10) : bookingId;
    if (numBookingId && !isNaN(numBookingId)) {
      try {
        const found = await Invoice.findOne({ where: { bookingId: numBookingId } });
        if (found) return found;
      } catch (e) {
        // Fallback for varchar column in DB
      }
    }
    try {
      return await Invoice.findOne({ where: { bookingId: String(bookingId) } });
    } catch (e) {
      return null;
    }
  }

  async createInvoice(data: any, options?: any): Promise<Invoice> {
    return (await Invoice.create(data, options)) as Invoice;
  }

  async findClaims(where?: any): Promise<FinancialClaim[]> {
    try {
      return await FinancialClaim.findAll({
        ...(where ? { where } : {}),
        order: [['createdAt', 'DESC']]
      });
    } catch (err) {
      if (where && where.providerId !== undefined) {
        try {
          const altWhere = { ...where, providerId: String(where.providerId) };
          return await FinancialClaim.findAll({
            where: altWhere,
            order: [['createdAt', 'DESC']]
          });
        } catch (e) {
          return [];
        }
      }
      return [];
    }
  }

  async findClaimByPk(id: any): Promise<FinancialClaim | null> {
    return FinancialClaim.findByPk(id);
  }

  async createClaim(data: any, options?: any): Promise<FinancialClaim> {
    return (await FinancialClaim.create(data, options)) as FinancialClaim;
  }

  async findClaimByProviderAndAmount(providerId: any, amount: number): Promise<FinancialClaim | null> {
    const numProviderId = typeof providerId === 'string' ? parseInt(providerId, 10) : providerId;
    if (numProviderId && !isNaN(numProviderId)) {
      try {
        const found = await FinancialClaim.findOne({ where: { providerId: numProviderId, amount } });
        if (found) return found;
      } catch (e) {
        // Fallback for varchar column in DB
      }
    }
    try {
      return await FinancialClaim.findOne({ where: { providerId: String(providerId), amount } });
    } catch (e) {
      return null;
    }
  }

  async findWallets(): Promise<Wallet[]> {
    return Wallet.findAll();
  }

  async findWalletByProvider(providerId: number, options?: any): Promise<Wallet | null> {
    return Wallet.findOne({ where: { providerId }, ...options });
  }

  async findOrCreateWallet(providerId: number, options?: any): Promise<[Wallet, boolean]> {
    try {
      return await Wallet.findOrCreate({
        where: { providerId },
        defaults: { balance: 0, pendingBalance: 0 },
        ...options
      });
    } catch (err) {
      console.warn(`findOrCreateWallet warning for providerId ${providerId}:`, err);
      const existing = await Wallet.findOne({ where: { providerId }, ...options });
      if (existing) {
        return [existing, false];
      }
      try {
        const created = (await Wallet.create({ providerId, balance: 0, pendingBalance: 0 }, options)) as Wallet;
        return [created, true];
      } catch (e) {
        const fallback = Wallet.build({ providerId, balance: 0, pendingBalance: 0 }) as Wallet;
        return [fallback, false];
      }
    }
  }

  async findTransactions(where?: any): Promise<WalletTransaction[]> {
    try {
      return await WalletTransaction.findAll({
        ...(where ? { where } : {}),
        order: [['createdAt', 'DESC']]
      });
    } catch (err) {
      if (where && where.providerId !== undefined) {
        try {
          const altWhere = { ...where, providerId: String(where.providerId) };
          return await WalletTransaction.findAll({
            where: altWhere,
            order: [['createdAt', 'DESC']]
          });
        } catch (e) {
          return [];
        }
      }
      return [];
    }
  }

  async findTransaction(where: any): Promise<WalletTransaction | null> {
    return WalletTransaction.findOne({ where });
  }

  async createTransaction(data: any, options?: any): Promise<WalletTransaction> {
    return (await WalletTransaction.create(data, options)) as WalletTransaction;
  }

  async findSupportServiceRequests(): Promise<SupportServiceRequest[]> {
    return SupportServiceRequest.findAll();
  }

  async findActiveSubscription(email: string): Promise<ProviderSubscription | null> {
    return ProviderSubscription.findOne({
      where: { providerEmail: email, status: 'active' }
    });
  }

  async findCustomerWallets(): Promise<CustomerWallet[]> {
    return CustomerWallet.findAll();
  }

  async findCustomerWallet(email: string): Promise<CustomerWallet | null> {
    return CustomerWallet.findOne({ where: { customerEmail: email } });
  }

  async findOrCreateCustomerWallet(email: string, defaults: any, options?: any): Promise<[CustomerWallet, boolean]> {
    return CustomerWallet.findOrCreate({
      where: { customerEmail: email },
      defaults,
      ...options
    });
  }

  async findCustomerHeldBalances(where?: any): Promise<CustomerHeldBalance[]> {
    return CustomerHeldBalance.findAll({
      ...(where ? { where } : {})
    });
  }

  async findCustomerHeldBalanceByPk(id: any): Promise<CustomerHeldBalance | null> {
    return CustomerHeldBalance.findByPk(id);
  }

  async createCustomerHeldBalance(data: any, options?: any): Promise<CustomerHeldBalance> {
    return (await CustomerHeldBalance.create(data, options)) as CustomerHeldBalance;
  }

  async sumClaims(column: string, where?: any): Promise<number> {
    try {
      const claims = await FinancialClaim.findAll();
      let filtered = claims;
      if (where) {
        if (where.providerId !== undefined) {
          const pId = Number(where.providerId);
          filtered = claims.filter((c: any) => Number(c.providerId) === pId);
        }
        if (where.status) {
          if (typeof where.status === 'object' && where.status[Op.ne]) {
            filtered = filtered.filter((c: any) => c.status !== where.status[Op.ne]);
          } else if (typeof where.status === 'string') {
            filtered = filtered.filter((c: any) => c.status === where.status);
          }
        }
      }
      return filtered.reduce((acc: number, curr: any) => acc + (Number(curr[column]) || 0), 0);
    } catch (e) {
      return 0;
    }
  }

  async sumTransactions(column: string, where?: any): Promise<number> {
    try {
      const txs = await WalletTransaction.findAll();
      let filtered = txs;
      if (where) {
        if (where.providerId !== undefined) {
          const pId = Number(where.providerId);
          filtered = txs.filter((t: any) => Number(t.providerId) === pId);
        }
        if (where.amount) {
          if (where.amount[Op.gt] !== undefined) {
            filtered = filtered.filter((t: any) => Number(t.amount) > where.amount[Op.gt]);
          } else if (where.amount[Op.lt] !== undefined) {
            filtered = filtered.filter((t: any) => Number(t.amount) < where.amount[Op.lt]);
          }
        }
      }
      return filtered.reduce((acc: number, curr: any) => acc + (Number(curr[column]) || 0), 0);
    } catch (e) {
      return 0;
    }
  }
}
