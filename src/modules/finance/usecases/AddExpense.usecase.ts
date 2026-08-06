import { IFinanceRepository } from '../finance.repository.js';
import { generateExpenseNumber } from './GenerateId.js';

export class AddExpenseUseCase {
  constructor(private financeRepository: IFinanceRepository) {}

  async execute(body: any) {
    const { 
      title, 
      amount, 
      category, 
      paymentMethod, 
      status, 
      EmployeeId, 
      providerId,
      dueDate,
      description,
      notes,
      attachmentUrl,
      isExternal,
      isTaxable 
    } = body;

    const taxable = isTaxable !== false && isTaxable !== 'false';
    const baseAmount = taxable ? (Number(amount) / 1.15) : Number(amount);
    const vatAmount = taxable ? (Number(amount) - baseAmount) : 0;
    
    const numericProviderId = providerId ? Number(providerId) : (category && !isNaN(Number(category)) ? Number(category) : null);

    const expenseNumber = await generateExpenseNumber();

    return this.financeRepository.createExpense({
      expenseNumber,
      title,
      amount: baseAmount,
      vatAmount,
      amountIncludingVat: Number(amount),
      category,
      paymentMethod: paymentMethod || 'cash',
      status: status || 'paid',
      EmployeeId: EmployeeId || 1,
      providerId: numericProviderId,
      dueDate: dueDate || null,
      description: description || null,
      notes: notes || null,
      attachmentUrl: attachmentUrl || null,
      isExternal: isExternal === true || isExternal === 'true',
      isTaxable: taxable
    });
  }
}
