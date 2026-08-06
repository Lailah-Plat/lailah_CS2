import { IMarketingRepository } from '../marketing.repository.js';

export class GetFavoritesCountUseCase {
  constructor(private marketingRepository: IMarketingRepository) {}

  async execute(hallId: number): Promise<number> {
    if (!hallId) {
      throw new Error('رقم القاعة مطلوب.');
    }
    return this.marketingRepository.getFavoritesCount(hallId);
  }
}
