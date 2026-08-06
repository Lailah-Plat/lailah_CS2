import { IFavoriteRepository } from '../favorite.repository.js';

export class DeleteFavoriteUseCase {
  constructor(private favoriteRepository: IFavoriteRepository) {}

  async execute(id: number): Promise<boolean> {
    if (!id) {
      throw new Error('معرّف المفضلة مطلوب');
    }
    return this.favoriteRepository.deleteFavoriteById(id);
  }
}
