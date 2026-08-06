import { IFavoriteRepository } from '../favorite.repository.js';

export interface ToggleFavoriteResult {
  status: 'added' | 'removed';
  message: string;
  favorite?: any;
}

export class ToggleFavoriteUseCase {
  constructor(private favoriteRepository: IFavoriteRepository) {}

  async execute(userId: number, hallId: number): Promise<ToggleFavoriteResult> {
    if (!userId || !hallId) {
      throw new Error('معرّف المستخدم ومعرّف القاعة مطلوبان');
    }

    const existing = await this.favoriteRepository.findFavorite(userId, hallId);

    if (existing) {
      await this.favoriteRepository.deleteFavorite(userId, hallId);
      return {
        status: 'removed',
        message: 'تمت إزالة القاعة من المفضلة بنجاح'
      };
    } else {
      const created = await this.favoriteRepository.createFavorite(userId, hallId);
      return {
        status: 'added',
        message: 'تمت إضافة القاعة للمفضلة بنجاح',
        favorite: created
      };
    }
  }
}
