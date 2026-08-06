import { BookingRepository } from '../booking.repository.js';
import { getSafeProviderName } from '../booking.helpers.js';
import { User } from '../../../models/UserModels.js';

export class GetServicesForHallUseCase {
  constructor(private repo: BookingRepository) {}

  async execute(hallId: string, userRole: string, req: any) {
    const providerName = getSafeProviderName(req);

    const list = await this.repo.findServices({
      where: { hallId },
      include: [{ model: User, as: 'providerUser', attributes: ['id', 'name'] }]
    });

    let parsedList = list.map(s => {
      const data = s.toJSON();
      if (s.providerUser) {
        data.provider = s.providerUser.name;
      }
      try { data.images = JSON.parse(data.images || '[]'); } catch(e) { data.images = []; }
      try { data.packages = JSON.parse(data.packages || '[]'); } catch(e) { data.packages = []; }
      try { data.addons = JSON.parse(data.addons || '[]'); } catch(e) { data.addons = []; }
      return data;
    });

    if (userRole === 'admin') {
      // Admin sees everything
    } else if (userRole === 'provider' && providerName) {
      parsedList = parsedList.filter((service: any) => {
        const isOwner = service.provider === providerName;
        const status = (service.status || '').toLowerCase();
        const adminStatus = (service.adminStatus || '').toLowerCase();
        const isApproved = status === 'approved' || adminStatus === 'approved' || status === 'active' || status === 'مفعل' || adminStatus === 'فعالة' || adminStatus === 'مفعلة';
        const isActive = service.activationStatus !== 'موقوف';
        return isOwner || (isApproved && isActive);
      });
    } else {
      parsedList = parsedList.filter((service: any) => {
        const status = (service.status || '').toLowerCase();
        const adminStatus = (service.adminStatus || '').toLowerCase();
        const isApproved = status === 'approved' || adminStatus === 'approved' || status === 'active' || status === 'مفعل' || adminStatus === 'فعالة' || adminStatus === 'مفعلة';
        const isActive = service.activationStatus !== 'موقوف';
        return isApproved && isActive;
      });
    }

    return parsedList;
  }
}
