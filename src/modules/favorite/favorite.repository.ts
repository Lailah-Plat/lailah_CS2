import { Favorite, syncFavorites } from '../../models/FavoriteModels.js';
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
    await syncFavorites();
    try {
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
    } catch (err) {
      console.error("Error in findAllByUserId favorites repository:", err);
      return [];
    }
  }

  async findFavorite(userId: number, hallId: number): Promise<any> {
    await syncFavorites();
    try {
      return await Favorite.findOne({
        where: { userId, hallId }
      });
    } catch (err) {
      console.error("Error in findFavorite repository:", err);
      return null;
    }
  }

  async createFavorite(userId: number, hallId: number): Promise<any> {
    await syncFavorites();
    return Favorite.create({
      userId,
      hallId
    });
  }

  async deleteFavorite(userId: number, hallId: number): Promise<boolean> {
    await syncFavorites();
    const deletedCount = await Favorite.destroy({
      where: { userId, hallId }
    });
    return deletedCount > 0;
  }

  async deleteFavoriteById(id: number): Promise<boolean> {
    await syncFavorites();
    const deletedCount = await Favorite.destroy({
      where: { id }
    });
    return deletedCount > 0;
  }
}
