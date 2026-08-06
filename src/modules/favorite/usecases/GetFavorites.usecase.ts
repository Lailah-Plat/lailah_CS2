import { IFavoriteRepository } from '../favorite.repository.js';

export class GetFavoritesUseCase {
  constructor(private favoriteRepository: IFavoriteRepository) {}

  async execute(userId: number): Promise<any[]> {
    if (!userId) {
      throw new Error('معرّف المستخدم مطلوب');
    }
    return this.favoriteRepository.findAllByUserId(userId);
  }
}
