import { IFinanceRepository } from '../finance.repository.js';
import { generateRevenueNumber } from './GenerateId.js';

export class AddRevenueUseCase {
  constructor(private financeRepository: IFinanceRepository) {}

  async execute(body: any) {
    const {
      title,
      type,
      amountIncludingVat,
      bookingId,
      providerId,
      paymentMethod,
      collectionMethod,
      referenceNumber,
      payerName,
      description,
      notes,
      attachmentUrl,
      isExternal,
      isTaxable
    } = body;

    const taxable = isTaxable !== false && isTaxable !== 'false';
    const baseAmount = taxable ? (Number(amountIncludingVat) / 1.15) : Number(amountIncludingVat);
    const vatAmount = taxable ? (Number(amountIncludingVat) - baseAmount) : 0;

    const revenueNumber = await generateRevenueNumber();

    return this.financeRepository.createRevenue({
      revenueNumber,
      title,
      type,
      amount: baseAmount,
      vatAmount,
      amountIncludingVat: Number(amountIncludingVat),
      bookingId: bookingId || null,
      providerId: providerId ? Number(providerId) : null,
      paymentMethod: paymentMethod || collectionMethod || 'mada',
      collectionMethod: collectionMethod || 'bank',
      referenceNumber: referenceNumber || null,
      payerName: payerName || null,
      description: description || null,
      notes: notes || null,
      attachmentUrl: attachmentUrl || null,
      isExternal: isExternal === true || isExternal === 'true'
    });
  }
}
