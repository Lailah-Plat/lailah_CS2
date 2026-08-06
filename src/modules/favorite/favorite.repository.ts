import { Favorite } from '../../models/FavoriteModels.js';
import { Hall } from '../../models/BookingModels.js';

export interface IFavoriteRepository {
  findAllByUserId(userId: number): Promise<any[]>;
  findFavorite(userId: number, hallId: number): Promise<any>;
  createFavorite(userId: number, hallId: number): Promise<any>;
  deleteFavorite(userId: number, hallId: number): Promise<boolean>;
  deleteFavoriteById(id: number): Promise<boolean>;
}

export class SequelizeFavoriteRepository implements IFavoriteRepository {
  async findAllByUserId(userId: number): Promise<any[]> {
    const favorites = await Favorite.findAll({
      where: { userId }
    });

    const hallIds = favorites.map(f => f.hallId);
    const halls = await Hall.findAll({
      where: { id: hallIds }
    });

    return favorites.map(fav => {
      const hall = halls.find(h => h.id === fav.hallId);
      return {
        id: fav.id,
        userId: fav.userId,
        hallId: fav.hallId,
        createdAt: (fav as any).createdAt,
        hall: hall || null
      };
    });
  }

  async findFavorite(userId: number, hallId: number): Promise<any> {
    return Favorite.findOne({
      where: { userId, hallId }
    });
  }

  async createFavorite(userId: number, hallId: number): Promise<any> {
    return Favorite.create({
      userId,
      hallId
    });
  }

  async deleteFavorite(userId: number, hallId: number): Promise<boolean> {
    const deletedCount = await Favorite.destroy({
      where: { userId, hallId }
    });
    return deletedCount > 0;
  }

  async deleteFavoriteById(id: number): Promise<boolean> {
    const deletedCount = await Favorite.destroy({
      where: { id }
    });
    return deletedCount > 0;
  }
}
