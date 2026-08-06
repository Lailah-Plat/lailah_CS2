import { Request, Response } from 'express';
import { SequelizeFavoriteRepository } from './favorite.repository.js';
import { GetFavoritesUseCase } from './usecases/GetFavorites.usecase.js';
import { ToggleFavoriteUseCase } from './usecases/ToggleFavorite.usecase.js';
import { DeleteFavoriteUseCase } from './usecases/DeleteFavorite.usecase.js';

export class FavoriteController {
  private favoriteRepository = new SequelizeFavoriteRepository();
  private getFavoritesUseCase = new GetFavoritesUseCase(this.favoriteRepository);
  private toggleFavoriteUseCase = new ToggleFavoriteUseCase(this.favoriteRepository);
  private deleteFavoriteUseCase = new DeleteFavoriteUseCase(this.favoriteRepository);

  getFavorites = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const result = await this.getFavoritesUseCase.execute(Number(userId));
      res.json(result);
    } catch (error: any) {
      console.error('Error in FavoriteController.getFavorites:', error);
      res.status(500).json({ error: error.message || 'حدث خطأ أثناء جلب المفضلة' });
    }
  };

  toggleFavorite = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, hallId } = req.body;
      const result = await this.toggleFavoriteUseCase.execute(Number(userId), Number(hallId));
      if (result.status === 'added') {
        res.status(201).json(result);
      } else {
        res.json(result);
      }
    } catch (error: any) {
      console.error('Error in FavoriteController.toggleFavorite:', error);
      res.status(400).json({ error: error.message || 'حدث خطأ أثناء تعديل المفضلة' });
    }
  };

  deleteFavorite = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const deleted = await this.deleteFavoriteUseCase.execute(Number(id));
      if (!deleted) {
        res.status(404).json({ error: 'المفضلة غير موجودة' });
        return;
      }
      res.json({ message: 'تم الحذف من المفضلة بنجاح' });
    } catch (error: any) {
      console.error('Error in FavoriteController.deleteFavorite:', error);
      res.status(500).json({ error: error.message || 'حدث خطأ أثناء الحذف من المفضلة' });
    }
  };
}
