import { Revenue, Invoice, FinancialClaim } from '../models/Database.js';

export async function processCompletedBooking(
  bookingId: string,
  bookingAmountIncludingVat: number,
  providerId: string,
  customerId: string,
  paymentMethod: string = 'mada',
  bankDetails: string = 'Pending update from provider'
) {
  try {
    // 1. Calculate amounts (15% VAT is included in total)
    // total = base + (base * 0.15) => base = total / 1.15
    const baseAmount = bookingAmountIncludingVat / 1.15;
    const bookingVatAmount = bookingAmountIncludingVat - baseAmount;

    // Platform commission logic (e.g., 10% from base amount)
    const commissionPercentage = 0.10;
    const commissionBase = baseAmount * commissionPercentage;
    const commissionVat = commissionBase * 0.15;
    const commissionTotal = commissionBase + commissionVat;

    // Provider Due amount
    const providerDue = bookingAmountIncludingVat - commissionTotal;

    // 2. Insert into Revenue (Platform commission)
    await Revenue.create({
      title: `عمولة من حجز #${bookingId}`,
      type: 'commission',
      amount: commissionBase,
      vatAmount: commissionVat,
      amountIncludingVat: commissionTotal,
      bookingId: bookingId,
      providerId: providerId,
      paymentMethod: paymentMethod,
    });

    // 3. Insert into Invoice
    await Invoice.create({
      customerId: customerId ? Number(customerId) : null,
      providerId: providerId ? Number(providerId) : null,
      bookingId: bookingId ? Number(bookingId) : null,
      totalAmount: bookingAmountIncludingVat,
      vatAmount: bookingVatAmount,
      status: 'paid',
    });

    // 4. Insert into FinancialClaim for Provider
    // (Money owed to the provider)
    await FinancialClaim.create({
      providerId: providerId,
      amount: providerDue,
      status: 'pending',
      bankDetails: bankDetails,
    });

    console.log(`Booking #${bookingId} processed successfully. Revenue & Claims generated.`);
    return true;
  } catch (error) {
    console.error(`Failed to process booking #${bookingId}:`, error);
    throw error;
  }
}
