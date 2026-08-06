import { IFinanceRepository } from '../finance.repository.js';

export class GetExpenseCategoriesUseCase {
  constructor(private financeRepository: IFinanceRepository) {}
  async execute() {
    return this.financeRepository.findExpenseCategories();
  }
}

export class CreateExpenseCategoryUseCase {
  constructor(private financeRepository: IFinanceRepository) {}
  async execute(name: string, key?: string) {
    if (!name) {
      throw new Error('الاسم مطلوب');
    }
    const customKey = key || `custom_${Date.now()}`;
    return this.financeRepository.createExpenseCategory({
      name,
      key: customKey,
      isSystem: false
    });
  }
}

export class UpdateExpenseCategoryUseCase {
  constructor(private financeRepository: IFinanceRepository) {}
  async execute(id: any, name: string) {
    if (!name) {
      throw new Error('الاسم مطلوب');
    }
    const category = await this.financeRepository.findExpenseCategoryByPk(id);
    if (!category) {
      throw new Error('تصنيف المصروف غير موجود');
    }
    if (category.isSystem) {
      throw new Error('لا يمكن تعديل الأنواع التلقائية للنظام');
    }
    category.name = name;
    await category.save();
    return category;
  }
}

export class DeleteExpenseCategoryUseCase {
  constructor(private financeRepository: IFinanceRepository) {}
  async execute(id: any) {
    const category = await this.financeRepository.findExpenseCategoryByPk(id);
    if (!category) {
      throw new Error('تصنيف المصروف غير موجود');
    }
    if (category.isSystem) {
      throw new Error('لا يمكن حذف الأنواع التلقائية للنظام');
    }
    await category.destroy();
    return true;
  }
}
