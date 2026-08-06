import { IFinanceRepository } from '../finance.repository.js';

export class GetRevenueTypesUseCase {
  constructor(private financeRepository: IFinanceRepository) {}
  async execute() {
    return this.financeRepository.findRevenueTypes();
  }
}

export class CreateRevenueTypeUseCase {
  constructor(private financeRepository: IFinanceRepository) {}
  async execute(name: string, key?: string) {
    if (!name) {
      throw new Error('الاسم مطلوب');
    }
    const customKey = key || `custom_${Date.now()}`;
    return this.financeRepository.createRevenueType({
      name,
      key: customKey,
      isSystem: false
    });
  }
}

export class UpdateRevenueTypeUseCase {
  constructor(private financeRepository: IFinanceRepository) {}
  async execute(id: any, name: string) {
    if (!name) {
      throw new Error('الاسم مطلوب');
    }
    const type = await this.financeRepository.findRevenueTypeByPk(id);
    if (!type) {
      throw new Error('نوع الإيراد غير موجود');
    }
    if (type.isSystem) {
      throw new Error('لا يمكن تعديل الأنواع التلقائية للنظام');
    }
    type.name = name;
    await type.save();
    return type;
  }
}

export class DeleteRevenueTypeUseCase {
  constructor(private financeRepository: IFinanceRepository) {}
  async execute(id: any) {
    const type = await this.financeRepository.findRevenueTypeByPk(id);
    if (!type) {
      throw new Error('نوع الإيراد غير موجود');
    }
    if (type.isSystem) {
      throw new Error('لا يمكن حذف الأنواع التلقائية للنظام');
    }
    await type.destroy();
    return true;
  }
}
