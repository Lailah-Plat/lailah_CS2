import { Op } from 'sequelize';
import { BookingRepository } from '../booking.repository.js';

export class GetAvailabilityUseCase {
  constructor(private repo: BookingRepository) {}

  async execute(hallId: any, date: any) {
    if (!hallId || !date) {
      const error: any = new Error('hallId and date are required');
      error.status = 400;
      throw error;
    }

    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    const bookings = await this.repo.findBookings({
      where: {
        hallId,
        status: { [Op.notIn]: ['cancelled'] },
        [Op.or]: [
          { startTime: { [Op.between]: [startOfDay, endOfDay] } },
          { endTime: { [Op.between]: [startOfDay, endOfDay] } },
          {
             startTime: { [Op.lte]: startOfDay },
             endTime: { [Op.gte]: endOfDay }
          }
        ]
      },
      attributes: ['startTime', 'endTime']
    });

    return { date, bookings };
  }
}
