import { DataTypes, Model } from 'sequelize';
import { sequelize } from './Database.js';

export class Favorite extends Model {
  declare id: number;
  declare userId: number;
  declare hallId: number;
}

Favorite.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  hallId: { type: DataTypes.INTEGER, allowNull: false }
}, {
  sequelize,
  modelName: 'Favorite',
  indexes: [
    {
      unique: true,
      fields: ['userId', 'hallId']
    }
  ]
});

export async function syncFavorites() {
  try {
    await Favorite.sync();
  } catch (e: any) {
    console.warn("Favorite.sync warning:", e.message || e);
  }
}
