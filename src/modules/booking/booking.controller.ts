import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { BookingRepository } from './booking.repository.js';
import {
  getSafeProviderName,
  awardLoyaltyPointsForBooking,
  deductLoyaltyPointsForCancelledBooking,
  formatHallResponse,
  syncHallExtraServicesTable,
  handleReBookingForceMajeureTrigger
} from './booking.helpers.js';

import { Hall, Service, Booking, BookingService, SupportServiceRequest, InventoryItem, Supplier, ForceMajeureRequest, HallExtraServices } from '../../models/BookingModels.js';
import { User, PlatformConfig } from '../../models/UserModels.js';

// Use Cases Imports
import { CreateBookingUseCase } from './usecases/CreateBooking.usecase.js';
import { CancelBookingUseCase } from './usecases/CancelBooking.usecase.js';
import { GetServicesForHallUseCase } from './usecases/GetServicesForHall.usecase.js';
import { GetAvailabilityUseCase } from './usecases/GetAvailability.usecase.js';
import { GetHallsUseCase } from './usecases/GetHalls.usecase.js';
import { ResolveForceMajeureUseCase } from './usecases/ResolveForceMajeure.usecase.js';
import { SyncInventoryUseCase } from './usecases/SyncInventory.usecase.js';
import { SyncMigrationUseCase } from './usecases/SyncMigration.usecase.js';

export class BookingController {
  private repo = new BookingRepository();

  // 1. Get Services for a specific Hall
  getServicesForHall = async (req: Request, res: Response) => {
    try {
      const hallId = req.params.id;
      const userRole = (req.headers['x-user-role'] || '') as string;
      const useCase = new GetServicesForHallUseCase(this.repo);
      const result = await useCase.execute(hallId, userRole, req);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // 2. Get Halls & Services Config
  getConfig = async (req: Request, res: Response) => {
    try {
      const halls = await this.repo.findHalls({
        where: { status: 'active' },
        include: [
          { model: HallExtraServices, as: 'extraServices' },
          { model: User, as: 'providerUser', attributes: ['id', 'name'] }
        ]
      });
      const services = await this.repo.findServices({
        include: [{ model: User, as: 'providerUser', attributes: ['id', 'name'] }]
      });
      const formattedServices = services.map(s => {
        const data = s.toJSON();
        if (s.providerUser) {
          data.provider = s.providerUser.name;
        }
        try { data.images = JSON.parse(data.images || '[]'); } catch(e) { data.images = []; }
        try { data.packages = JSON.parse(data.packages || '[]'); } catch(e) { data.packages = []; }
        try { data.addons = JSON.parse(data.addons || '[]'); } catch(e) { data.addons = []; }
        return data;
      });
      res.json({ halls: halls.map(formatHallResponse), services: formattedServices });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // 3. Check Availability
  getAvailability = async (req: Request, res: Response) => {
    try {
      const { hallId, date } = req.query;
      const useCase = new GetAvailabilityUseCase(this.repo);
      const result = await useCase.execute(hallId, date);
      res.json(result);
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ error: error.message });
    }
  };

  // 4. Create Booking
  createBooking = async (req: Request, res: Response) => {
    try {
      const useCase = new CreateBookingUseCase(this.repo);
      const result = await useCase.execute(req.body, req.app.get("io"), req);
      res.status(201).json(result);
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ error: error.message });
    }
  };

  // 5. Dedicated my-bookings endpoint
  getMyBookings = async (req: Request, res: Response) => {
    try {
      const { userId, phone, email } = req.query;

      const whereClause: any = {};
      const conditions: any[] = [];

      if (userId) {
        conditions.push({ userId: Number(userId) });
      }
      if (phone) {
        conditions.push({ customerPhone: String(phone) });
      }
      if (email) {
        conditions.push({ customerEmail: String(email) });
      }

      if (conditions.length > 0) {
        whereClause[Op.or] = conditions;
      } else {
        return res.json([]);
      }

      const bookings = await this.repo.findBookings({
        where: whereClause,
        include: [
          { model: Hall, as: 'hall' },
          { model: BookingService, as: 'bookingServices', include: ['serviceInfo'] }
        ],
        order: [['startTime', 'DESC']]
      });

      const parsedBookings = bookings.map((b: any) => {
        const data = b.toJSON();
        if (data.hall) {
          data.hall = formatHallResponse(b.hall);
        }
        try { data.selectedAddons = typeof data.selectedAddons === 'string' ? JSON.parse(data.selectedAddons || '[]') : (data.selectedAddons || []); } catch(e) { data.selectedAddons = []; }
        try { data.externalServices = typeof data.externalServices === 'string' ? JSON.parse(data.externalServices || '[]') : (data.externalServices || []); } catch(e) { data.externalServices = []; }
        return data;
      });

      res.json(parsedBookings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // 6. Get All Bookings
  getAllBookings = async (req: Request, res: Response) => {
    try {
      const bookings = await this.repo.findBookings({
        include: [
          { model: Hall, as: 'hall' },
          { model: BookingService, as: 'bookingServices', include: ['serviceInfo'] }
        ],
        order: [['startTime', 'DESC']]
      });
      const parsedBookings = bookings.map((b: any) => {
        const data = b.toJSON();
        if (data.hall) {
          data.hall = formatHallResponse(b.hall);
        }
        try { data.selectedAddons = typeof data.selectedAddons === 'string' ? JSON.parse(data.selectedAddons || '[]') : (data.selectedAddons || []); } catch(e) { data.selectedAddons = []; }
        try { data.externalServices = typeof data.externalServices === 'string' ? JSON.parse(data.externalServices || '[]') : (data.externalServices || []); } catch(e) { data.externalServices = []; }
        return data;
      });
      res.json(parsedBookings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // 7. Add/Update Service for Hall (Admin)
  addServiceForHall = async (req: Request, res: Response) => {
    try {
      const hallId = req.params.id;
      const { name, description, quantity, price } = req.body;
      
      const service = await this.repo.createService({
        hallId: Number(hallId),
        name,
        description,
        quantity: quantity !== undefined ? Number(quantity) : null,
        price: Number(price || 0),
        status: 'approved'
      });
      res.status(201).json(service);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // 8. Get Halls (Marafek/Halls)
  getHalls = async (req: Request, res: Response) => {
    try {
      const userRole = (req.headers['x-user-role'] || '') as string;
      const useCase = new GetHallsUseCase(this.repo);
      const result = await useCase.execute(userRole, req);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // 9. Create Hall
  createHall = async (req: Request, res: Response) => {
    try {
      const { extraServices, extraServicesList, services: reqServices, ...body } = req.body;
      const rawExtraServices = extraServices || extraServicesList || reqServices || [];
      const services = Array.isArray(rawExtraServices) 
        ? rawExtraServices 
        : (typeof rawExtraServices === 'string' ? (JSON.parse(rawExtraServices || '[]')) : []);

      const providerIdHeader = req.headers['x-user-id'];
      if (providerIdHeader) {
        body.providerId = Number(providerIdHeader);
      }

      const hall = await this.repo.createHall({
        ...body,
        images: Array.isArray(req.body.images) ? JSON.stringify(req.body.images) : String(req.body.images || '[]'),
        features: Array.isArray(req.body.features) ? JSON.stringify(req.body.features) : String(req.body.features || '[]'),
        rules: Array.isArray(req.body.rules) ? JSON.stringify(req.body.rules) : String(req.body.rules || '[]'),
        extraServicesList: JSON.stringify(services),
        packagesList: Array.isArray(req.body.packagesList) ? JSON.stringify(req.body.packagesList) : String(req.body.packagesList || '[]')
      });

      await syncHallExtraServicesTable(hall.id, services, hall.providerId);

      const reloaded = await this.repo.findHallByPk(hall.id, {
        include: [
          { model: HallExtraServices, as: 'extraServices' },
          { model: User, as: 'providerUser', attributes: ['id', 'name'] }
        ]
      });

      if (!reloaded) throw new Error('Failed to reload created hall');

      const io = req.app.get("io");
      if (io) {
        io.emit("new_hall_event", formatHallResponse(reloaded));
      }

      res.status(201).json(formatHallResponse(reloaded));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // 10. Update Hall
  updateHall = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const hall = await this.repo.findHallByPk(id);
      if (!hall) return res.status(404).json({ error: 'القاعة غير موجودة' });

      const { extraServices, extraServicesList, services: reqServices, ...body } = req.body;
      const rawExtraServices = extraServices !== undefined ? extraServices : (extraServicesList !== undefined ? extraServicesList : reqServices);
      
      let servicesToUpdate: any[] | undefined = undefined;
      if (rawExtraServices !== undefined) {
        servicesToUpdate = Array.isArray(rawExtraServices)
          ? rawExtraServices
          : (typeof rawExtraServices === 'string' ? (JSON.parse(rawExtraServices || '[]')) : []);
      }

      await hall.update({
        ...body,
        images: Array.isArray(req.body.images) ? JSON.stringify(req.body.images) : (req.body.images !== undefined ? String(req.body.images) : hall.images),
        features: Array.isArray(req.body.features) ? JSON.stringify(req.body.features) : (req.body.features !== undefined ? String(req.body.features) : hall.features),
        rules: Array.isArray(req.body.rules) ? JSON.stringify(req.body.rules) : (req.body.rules !== undefined ? String(req.body.rules) : hall.rules),
        extraServicesList: servicesToUpdate !== undefined ? JSON.stringify(servicesToUpdate) : hall.extraServicesList,
        packagesList: Array.isArray(req.body.packagesList) ? JSON.stringify(req.body.packagesList) : (req.body.packagesList !== undefined ? String(req.body.packagesList) : hall.packagesList)
      });

      if (servicesToUpdate !== undefined) {
        await syncHallExtraServicesTable(hall.id, servicesToUpdate, hall.providerId);
      }

      const reloaded = await this.repo.findHallByPk(hall.id, {
        include: [
          { model: HallExtraServices, as: 'extraServices' },
          { model: User, as: 'providerUser', attributes: ['id', 'name'] }
        ]
      });

      if (!reloaded) throw new Error('Failed to reload updated hall');

      const io = req.app.get("io");
      if (io) {
        io.emit("hall_updated_event", formatHallResponse(reloaded));
      }

      res.json(formatHallResponse(reloaded));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // 11. Delete Hall
  deleteHall = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const hall = await this.repo.findHallByPk(id);
      if (!hall) return res.status(404).json({ error: 'القاعة غير موجودة' });
      await hall.destroy();
      res.json({ message: 'تم حذف القاعة بنجاح' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // 12. Get Hall Extra Services
  getHallExtraServices = async (req: Request, res: Response) => {
    try {
      const { hallId } = req.params;
      const list = await this.repo.findHallExtraServices({ where: { hallId } });
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // 13. Create Hall Extra Service
  createHallExtraService = async (req: Request, res: Response) => {
    try {
      const { hallId } = req.params;
      const { nameAr, nameEn, description, category, priceType, price, status, imageUrl, quantity } = req.body;
      const hall = await this.repo.findHallByPk(hallId);
      const providerId = hall?.providerId || null;

      const item = await this.repo.createHallExtraService({
        hallId: Number(hallId),
        providerId,
        nameAr,
        nameEn,
        description,
        category,
        priceType,
        price: Number(price || 0),
        status: status || 'active',
        imageUrl,
        quantity: quantity !== undefined ? Number(quantity) : null
      });
      res.status(201).json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // 14. Update Hall Extra Service
  updateHallExtraService = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const item = await this.repo.findHallExtraServiceByPk(id);
      if (!item) return res.status(404).json({ error: 'الخدمة الإضافية غير موجودة' });

      await item.update(req.body);
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // 15. Delete Hall Extra Service
  deleteHallExtraService = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const item = await this.repo.findHallExtraServiceByPk(id);
      if (!item) return res.status(404).json({ error: 'الخدمة الإضافية غير موجودة' });

      await item.destroy();
      res.json({ message: 'تم الحذف بنجاح' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // 16. Get Services
  getServices = async (req: Request, res: Response) => {
    try {
      const userRole = req.headers['x-user-role'] || '';
      const providerName = getSafeProviderName(req);

      const list = await this.repo.findServices({
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
        // Admin sees all
      } else if (userRole === 'provider' && providerName) {
        parsedList = parsedList.filter((service: any) => {
          const isOwner = service.provider === providerName;
          const isApproved = String(service.status || '').toLowerCase() === 'approved';
          const isActive = service.activationStatus !== 'موقوف';
          return isOwner || (isApproved && isActive);
        });
      } else {
        parsedList = parsedList.filter((service: any) => {
          const isApproved = String(service.status || '').toLowerCase() === 'approved';
          const isActive = service.activationStatus !== 'موقوف';
          return isApproved && isActive;
        });
      }

      res.json(parsedList);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // 17. Create Service
  createService = async (req: Request, res: Response) => {
    try {
      const body = { ...req.body };
      const providerIdHeader = req.headers['x-user-id'];
      if (providerIdHeader) {
        body.providerId = Number(providerIdHeader);
      }

      const service = await this.repo.createService({
        ...body,
        images: Array.isArray(req.body.images) ? JSON.stringify(req.body.images) : String(req.body.images || '[]'),
        packages: Array.isArray(req.body.packages) ? JSON.stringify(req.body.packages) : String(req.body.packages || '[]'),
        addons: Array.isArray(req.body.addons) ? JSON.stringify(req.body.addons) : String(req.body.addons || '[]')
      });
      const data = service.toJSON();
      try { data.images = JSON.parse(data.images || '[]'); } catch(e) { data.images = []; }
      try { data.packages = JSON.parse(data.packages || '[]'); } catch(e) { data.packages = []; }
      try { data.addons = JSON.parse(data.addons || '[]'); } catch(e) { data.addons = []; }
      res.status(201).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // 18. Update Service
  updateService = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const service = await this.repo.findServiceByPk(id);
      if (!service) return res.status(404).json({ error: 'الخدمة غير موجودة' });

      await service.update({
        ...req.body,
        images: Array.isArray(req.body.images) ? JSON.stringify(req.body.images) : (req.body.images !== undefined ? String(req.body.images) : service.images),
        packages: Array.isArray(req.body.packages) ? JSON.stringify(req.body.packages) : (req.body.packages !== undefined ? String(req.body.packages) : service.packages),
        addons: Array.isArray(req.body.addons) ? JSON.stringify(req.body.addons) : (req.body.addons !== undefined ? String(req.body.addons) : service.addons)
      });
      const data = service.toJSON();
      try { data.images = JSON.parse(data.images || '[]'); } catch(e) { data.images = []; }
      try { data.packages = JSON.parse(data.packages || '[]'); } catch(e) { data.packages = []; }
      try { data.addons = JSON.parse(data.addons || '[]'); } catch(e) { data.addons = []; }
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // 19. Delete Service
  deleteService = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const service = await this.repo.findServiceByPk(id);
      if (!service) return res.status(404).json({ error: 'الخدمة غير موجودة' });
      await service.destroy();
      res.json({ message: 'تم حذف الخدمة بنجاح' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // 20. Cancel Booking
  cancelBooking = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userEmail } = req.body;
      const useCase = new CancelBookingUseCase(this.repo);
      const result = await useCase.execute(id, userEmail, req.app.get("io"), req);
      res.json(result);
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ error: error.message });
    }
  };

  // 21. Update Booking
  updateBooking = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const booking = await this.repo.findBookingByPk(id);
      if (!booking) return res.status(404).json({ error: 'الحجز غير موجود' });
      
      const updateData = { ...req.body };
      if (updateData.customer) updateData.customerName = updateData.customer;
      if (updateData.phone) updateData.customerPhone = updateData.phone;
      if (updateData.startDate) updateData.startTime = new Date(updateData.startDate);
      if (updateData.endDate) updateData.endTime = new Date(updateData.endDate);
      if (updateData.amount) updateData.totalAmount = Number(updateData.amount);

      const oldStatus = booking.status;
      const oldPaymentStatus = booking.paymentStatus;
      await booking.update(updateData);
      
      if (booking.userId) {
        const isNowActive = (oldStatus !== 'confirmed' && booking.status === 'confirmed') || 
                            (oldStatus !== 'completed' && booking.status === 'completed') || 
                            (oldPaymentStatus !== 'مدفوع' && booking.paymentStatus === 'مدفوع');
        const isNowCancelled = (oldStatus === 'confirmed' || oldStatus === 'completed') && booking.status === 'cancelled';
        
        if (isNowActive) {
          await awardLoyaltyPointsForBooking(booking);
        } else if (isNowCancelled) {
          await deductLoyaltyPointsForCancelledBooking(booking);
        }
      }

      if (oldStatus !== 'confirmed' && booking.status === 'confirmed') {
        try {
          await handleReBookingForceMajeureTrigger(booking, req);
        } catch (err: any) {
          console.error('Error handling force majeure trigger on update:', err);
        }
      }
      res.json(booking);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // 22. Delete Booking
  deleteBooking = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const booking = await this.repo.findBookingByPk(id);
      if (!booking) return res.status(404).json({ error: 'الحجز غير موجود' });
      await booking.destroy();
      res.json({ message: 'تم حذف الحجز بنجاح' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // 23. Get Support Service Requests
  getSupportRequests = async (req: Request, res: Response) => {
    try {
      const list = await this.repo.findSupportRequests({ order: [['id', 'DESC']] });
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // 24. Create Support Service Request
  createSupportRequest = async (req: Request, res: Response) => {
    try {
      const item = await this.repo.createSupportRequest({
        ...req.body,
        documents: Array.isArray(req.body.documents) ? JSON.stringify(req.body.documents) : String(req.body.documents || '[]')
      });
      res.status(201).json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // 25. Update Support Service Request
  updateSupportRequest = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const item = await this.repo.findSupportRequestByPk(id);
      if (!item) return res.status(404).json({ error: 'الطلب غير موجود' });

      await item.update({
        ...req.body,
        documents: Array.isArray(req.body.documents) ? JSON.stringify(req.body.documents) : (req.body.documents !== undefined ? String(req.body.documents) : (item as any).documents)
      });
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // 26. Delete Support Service Request
  deleteSupportRequest = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const item = await this.repo.findSupportRequestByPk(id);
      if (!item) return res.status(404).json({ error: 'الطلب غير موجود' });

      await item.destroy();
      res.json({ message: 'تم الحذف بنجاح' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // 27. Get Inventory
  getInventory = async (req: Request, res: Response) => {
    try {
      const userRole = (req.headers['x-user-role'] || '') as string;
      const rawHeaderName = req.headers['x-user-name'] as string;
      const providerName = rawHeaderName ? decodeURIComponent(rawHeaderName) : '';
      const providerId = req.headers['x-user-id'] ? Number(req.headers['x-user-id']) : null;

      let whereClause: any = {};
      if (userRole === 'provider') {
        const conditions: any[] = [];
        if (providerId && !isNaN(providerId)) conditions.push({ providerId: Number(providerId) });
        if (providerName) {
          conditions.push({ providerName });
          conditions.push({ supplier: providerName });
        }
        if (conditions.length > 0) {
          whereClause = { [Op.or]: conditions };
        }
      }

      let list: any[] = [];
      try {
        list = await this.repo.findInventoryItems({
          where: whereClause,
          order: [['id', 'DESC']]
        });
      } catch (dbErr: any) {
        console.warn('getInventory query with whereClause failed, attempting fallback:', dbErr.message || dbErr);
        try {
          const allItems = await this.repo.findInventoryItems({ order: [['id', 'DESC']] });
          if (userRole === 'provider') {
            list = allItems.filter((item: any) => 
              (providerId && Number(item.providerId) === Number(providerId)) ||
              (providerName && item.providerName === providerName) ||
              (providerName && item.supplier === providerName)
            );
          } else {
            list = allItems;
          }
        } catch (e: any) {
          list = [];
        }
      }
      res.json(list);
    } catch (error: any) {
      console.error('getInventory error:', error);
      res.status(500).json({ error: error.message });
    }
  };

  // 28. Create Inventory Item
  createInventoryItem = async (req: Request, res: Response) => {
    try {
      const rawHeaderName = req.headers['x-user-name'] as string;
      const providerName = rawHeaderName ? decodeURIComponent(rawHeaderName) : '';
      const providerId = req.headers['x-user-id'] ? Number(req.headers['x-user-id']) : null;

      const body = {
        ...req.body,
        providerId: req.body.providerId || providerId,
        providerName: req.body.providerName || providerName,
        lastUpdated: new Date().toISOString().split('T')[0]
      };

      const item = await this.repo.createInventoryItem(body);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // 29. Update Inventory Item
  updateInventoryItem = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const item = await this.repo.findInventoryItemByPk(id);
      if (!item) return res.status(404).json({ error: 'القطعة غير موجودة' });

      await item.update({
        ...req.body,
        lastUpdated: new Date().toISOString().split('T')[0]
      });
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // 30. Delete Inventory Item
  deleteInventoryItem = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const item = await this.repo.findInventoryItemByPk(id);
      if (!item) return res.status(404).json({ error: 'القطعة غير موجودة' });

      await item.destroy();
      res.json({ message: 'تم الحذف بنجاح' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // 31. Inventory Logs & Damage Audit
  getInventoryLogs = async (req: Request, res: Response) => {
    try {
      const logs = await this.repo.findInventoryLogs({ order: [['id', 'DESC']] });
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  createInventoryLog = async (req: Request, res: Response) => {
    try {
      const log = await this.repo.createInventoryLog(req.body);
      res.status(201).json(log);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // 32. Sync Inventory with External Simulated Source
  syncInventory = async (req: Request, res: Response) => {
    try {
      const useCase = new SyncInventoryUseCase(this.repo);
      const result = await useCase.execute(req.app.get("io"));
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // 33. Get Suppliers
  getSuppliers = async (req: Request, res: Response) => {
    try {
      const userRole = (req.headers['x-user-role'] || '') as string;
      const rawHeaderName = req.headers['x-user-name'] as string;
      const providerName = rawHeaderName ? decodeURIComponent(rawHeaderName) : '';
      const providerId = req.headers['x-user-id'] ? Number(req.headers['x-user-id']) : null;

      let whereClause: any = {};
      if (userRole === 'provider') {
        const conditions: any[] = [];
        if (providerId && !isNaN(providerId)) conditions.push({ providerId: Number(providerId) });
        if (providerName) conditions.push({ providerName });
        conditions.push({ providerId: null }); // allow system default suppliers
        
        whereClause = { [Op.or]: conditions };
      }

      let list: any[] = [];
      try {
        list = await this.repo.findSuppliers({
          where: whereClause,
          order: [['id', 'DESC']]
        });
      } catch (dbErr: any) {
        console.warn('getSuppliers query with whereClause failed, attempting fallback:', dbErr.message || dbErr);
        try {
          const allSuppliers = await this.repo.findSuppliers({ order: [['id', 'DESC']] });
          if (userRole === 'provider') {
            list = allSuppliers.filter((sup: any) => 
              sup.providerId === null ||
              (providerId && Number(sup.providerId) === Number(providerId)) ||
              (providerName && sup.providerName === providerName)
            );
          } else {
            list = allSuppliers;
          }
        } catch (e: any) {
          list = [];
        }
      }
      res.json(list);
    } catch (error: any) {
      console.error('getSuppliers error:', error);
      res.status(500).json({ error: error.message });
    }
  };

  // 34. Create Supplier
  createSupplier = async (req: Request, res: Response) => {
    try {
      const rawHeaderName = req.headers['x-user-name'] as string;
      const providerName = rawHeaderName ? decodeURIComponent(rawHeaderName) : '';
      const providerId = req.headers['x-user-id'] ? Number(req.headers['x-user-id']) : null;

      const body = {
        ...req.body,
        providerId: req.body.providerId || providerId,
        providerName: req.body.providerName || providerName
      };

      const item = await this.repo.createSupplier(body);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // 35. Update Supplier
  updateSupplier = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const item = await this.repo.findSupplierByPk(id);
      if (!item) return res.status(404).json({ error: 'المورد غير موجود' });

      await item.update(req.body);
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // 36. Delete Supplier
  deleteSupplier = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const item = await this.repo.findSupplierByPk(id);
      if (!item) return res.status(404).json({ error: 'المورد غير موجود' });

      await item.destroy();
      res.json({ message: 'تم الحذف بنجاح' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // 37. Supplier Invoices & 3-Way Matching
  getSupplierInvoices = async (req: Request, res: Response) => {
    try {
      const list = await this.repo.findSupplierInvoices({ order: [['id', 'DESC']] });
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  createSupplierInvoice = async (req: Request, res: Response) => {
    try {
      const item = await this.repo.createSupplierInvoice(req.body);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // 36. Get Force Majeure Cancellation Requests
  getForceMajeure = async (req: Request, res: Response) => {
    try {
      const list = await this.repo.findForceMajeureRequests({ order: [['id', 'DESC']] });
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // 37. Submit Force Majeure Cancellation Request
  createForceMajeure = async (req: Request, res: Response) => {
    try {
      let enableProtocol = true;
      try {
        const standalone = await PlatformConfig.findByPk('ENABLE_FORCE_MAJEURE_PROTOCOL');
        if (standalone) {
          enableProtocol = String(standalone.value) === 'true';
        } else {
          const config = await PlatformConfig.findByPk('SYSTEM_FINANCIAL_SETTINGS');
          if (config) {
            const parsed = JSON.parse(config.value);
            if (parsed && parsed.enableForceMajeureProtocol !== undefined) {
              enableProtocol = parsed.enableForceMajeureProtocol;
            }
          }
        }
      } catch (e) {
        console.warn("Could not read force majeure config, default to true");
      }

      if (!enableProtocol) {
        return res.status(403).json({ error: 'عذراً، بروتوكول القوة القاهرة معطل حالياً من قبل الإدارة.' });
      }

      const { bookingId, reason, documents } = req.body;
      if (!bookingId || !reason) {
        return res.status(400).json({ error: 'معرف الحجز وسبب الالغاء مطلوبان.' });
      }

      const booking = await this.repo.findBookingByPk(bookingId);
      if (!booking) {
        return res.status(404).json({ error: 'الحجز غير موجود.' });
      }

      const existing = await ForceMajeureRequest.findOne({ where: { bookingId } });
      if (existing) {
        return res.status(400).json({ error: 'تم تقديم طلب ظروف قاهرة مسبقاً لهذا الحجز.' });
      }

      let finalEmail = '';
      const matchedUser = await User.findOne({
        where: {
          [Op.or]: [
            { phone: booking.customerPhone },
            { name: booking.customerName }
          ]
        }
      });

      if (matchedUser) {
        finalEmail = matchedUser.email;
      } else {
        finalEmail = booking.customerPhone ? `${booking.customerPhone}@lailah.customer` : 'customer@lailah.customer';
      }

      const request = await this.repo.createForceMajeureRequest({
        bookingId,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        customerEmail: finalEmail,
        reason,
        documents: JSON.stringify(documents || []),
        status: 'pending',
        adminNotes: '',
        amountRefunded: 0,
        refundType: 'none',
        resolvedAt: null
      });

      const io = req.app.get("io");
      if (io) {
        io.emit("new_force_majeure_request", request);
      }

      res.status(201).json({ success: true, message: 'تم تقديم طلب القوة القاهرة بنجاح وبانتظار المراجعة والبت فيه خلال 24 ساعة.', request });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // 38. Resolve Force Majeure Claim
  resolveForceMajeure = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;
      const useCase = new ResolveForceMajeureUseCase(this.repo);
      const result = await useCase.execute(id, status, adminNotes, req.app.get("io"));
      res.json(result);
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ error: error.message });
    }
  };

  // 39. Sync Migration data from local UI storage
  syncMigration = async (req: Request, res: Response) => {
    try {
      const {
        halls: clientHalls,
        services: clientServices,
        bookings: clientBookings,
        supportTickets: clientSupportTickets,
        supportRequests: clientSupportRequests,
        regions: clientRegions
      } = req.body;
      const useCase = new SyncMigrationUseCase(this.repo);
      const result = await useCase.execute(
        clientHalls,
        clientServices,
        clientBookings,
        clientSupportTickets,
        clientSupportRequests,
        clientRegions
      );
      res.json(result);
    } catch (err: any) {
      console.error("Migration/Sync Error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  };

  // 40. Clean Activation Statuses and map Provider IDs
  cleanActivationStatus = async (req: Request, res: Response) => {
    try {
      await Hall.update(
        { activationStatus: 'مفعل' },
        { where: { activationStatus: [null, '', 'undefined'] as any } }
      );
      await Service.update(
        { activationStatus: 'مفعل' },
        { where: { activationStatus: [null, '', 'undefined'] as any } }
      );

      const halls = await Hall.findAll({ where: { providerId: null } });
      for (const h of halls) {
        if (h.provider) {
          const u = await User.findOne({ where: { name: h.provider } });
          if (u) {
            await h.update({ providerId: u.id });
          }
        }
      }

      const services = await Service.findAll({ where: { providerId: null } });
      for (const s of services) {
        if (s.provider) {
          const u = await User.findOne({ where: { name: s.provider } });
          if (u) {
            await s.update({ providerId: u.id });
          }
        }
      }

      res.json({ success: true, message: 'Database activation statuses sanitized, provider IDs mapped successfully.' });
    } catch (err: any) {
      console.error("Clean Activation Status error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  };
}
