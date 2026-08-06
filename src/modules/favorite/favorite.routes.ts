import express from 'express';
import { FavoriteController } from './favorite.controller.js';

const router = express.Router();
const controller = new FavoriteController();

router.get('/:userId', controller.getFavorites);
router.post('/toggle', controller.toggleFavorite);
router.delete('/:id', controller.deleteFavorite);

export default router;
