import { IFinanceRepository } from "../../modules/finance/finance.repository.js";
import { generateInvoiceNumber } from "../../modules/finance/usecases/GenerateId.js";

export class InvoiceService {
  /**
   * Creates a formal system invoice for a completed booking or service order.
   */
  static async createInvoice(
    financeRepository: IFinanceRepository,
    bookingId: any,
    customerId: any,
    totalAmount: number,
    vatAmount: number,
    status: "paid" | "pending" | "refunded" = "paid",
    options?: any
  ) {
    const invoiceNumber = await generateInvoiceNumber();
    return financeRepository.createInvoice({
      invoiceNumber,
      customerId: customerId ? Number(customerId) : null,
      bookingId: bookingId ? Number(bookingId) : null,
      totalAmount,
      vatAmount,
      status,
    }, options);
  }
}
