import { BookingRepository } from '../booking.repository.js';
import { getSafeProviderName, formatHallResponse } from '../booking.helpers.js';
import { HallExtraServices } from '../../../models/BookingModels.js';
import { User } from '../../../models/UserModels.js';

export class GetHallsUseCase {
  constructor(private repo: BookingRepository) {}

  async execute(userRole: string, req: any) {
    const providerName = getSafeProviderName(req);

    const list = await this.repo.findHalls({
      include: [
        { model: HallExtraServices, as: 'extraServices' },
        { model: User, as: 'providerUser', attributes: ['id', 'name'] }
      ],
      order: [['id', 'DESC']]
    });

    let parsedList = list.map(formatHallResponse);

    if (userRole === 'admin') {
      // Admin sees all
    } else if (userRole === 'provider' && providerName) {
      parsedList = parsedList.filter((hall: any) => {
        const isOwner = hall.provider === providerName;
        const isApproved = String(hall.status || '').toLowerCase() === 'approved';
        const isActive = hall.activationStatus !== 'موقوف';
        return isOwner || (isApproved && isActive);
      });
    } else {
      parsedList = parsedList.filter((hall: any) => {
        const isApproved = String(hall.status || '').toLowerCase() === 'approved';
        const isActive = hall.activationStatus !== 'موقوف';
        return isApproved && isActive;
      });
    }

    return parsedList;
  }
}
