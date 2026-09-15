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
import { LifecycleAuditLog, DomainEvent } from '../../models/Database.js';
import { BookingStateMachine, BookingState, PaymentState } from '../../services/lifecycle/BookingStateMachine.js';
import { ServiceRequestStateMachine, ServiceRequestState, ServicePaymentState } from '../../services/lifecycle/ServiceRequestStateMachine.js';
import { bookingPolicyService, BOOKING_POLICY_DEFINITIONS } from '../../services/bookingPolicy/bookingPolicyService.js';
import { BookingHoldService } from '../../services/bookingPolicy/bookingHoldService.js';
import { PeriodConflictService } from '../../services/bookingPolicy/periodConflictService.js';
import { regulatoryPeriodService } from '../../services/bookingPolicy/regulatoryPeriodService.js';
import { ExternalBlockedDate } from '../../models/BookingModels.js';

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
      const userRole = (req.headers['x-user-role'] as string) || (req as any).user?.role || '';

      // Check Provider Cancellation Restriction (Section D / Section 12)
      if (userRole === 'provider') {
        const targetBooking = await this.repo.findBookingByPk(id);
        const guard = bookingPolicyService.validateProviderCanDirectlyCancel(targetBooking);
        if (!guard.allowed) {
          return res.status(403).json({
            code: 'provider_direct_cancel_forbidden',
            error: guard.reason
          });
        }
      }

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
      // Resolve policy for service request (P1.9)
      const resolvedPolicyData = await bookingPolicyService.resolveEffectiveBookingPolicy({
        providerId: Number(req.body.providerId) || 0,
        serviceId: req.body.serviceId ? Number(req.body.serviceId) : null,
        explicitPolicy: req.body.bookingPaymentPolicy || null
      });

      const activePolicy = resolvedPolicyData.policy;
      const policySnapshotStr = JSON.stringify(resolvedPolicyData.snapshot);

      // P2.3-P2.4 Snapshot Regulatory Timing for Service Request
      const serviceDate = req.body.date ? PeriodConflictService.normalizeDate(req.body.date) : new Date().toISOString().split('T')[0];
      const servicePeriodSnapshot = await regulatoryPeriodService.createPeriodSnapshot('FULL_DAY', serviceDate);
      const periodSnapshotStr = JSON.stringify(servicePeriodSnapshot);

      const deadlineHours = resolvedPolicyData.snapshot.providerResponseDeadlineHours;
      const providerResponseDeadline = (deadlineHours && deadlineHours > 0)
        ? new Date(Date.now() + deadlineHours * 60 * 60 * 1000)
        : null;

      // Compute initial 8 axes
      const initialAxes = ServiceRequestStateMachine.computeInitialAxes({
        policy: activePolicy,
        hasPrePaid: req.body.paymentStatus === 'مدفوع' || req.body.paymentStatus === 'PAID',
        hasAuthorized: req.body.paymentStatus === 'AUTHORIZED' || req.body.paymentStatus === 'مفوض'
      });

      const preApproval = req.body.preApprovalSnapshot 
        ? (typeof req.body.preApprovalSnapshot === 'object' ? JSON.stringify(req.body.preApprovalSnapshot) : String(req.body.preApprovalSnapshot))
        : JSON.stringify({
            grossAmount: req.body.price || req.body.amount || 0,
            serviceName: req.body.serviceName,
            quantity: req.body.quantity || 1,
            bookingPaymentPolicy: activePolicy,
            createdAt: new Date().toISOString()
          });

      const item = await this.repo.createSupportRequest({
        ...req.body,
        status: initialAxes.legacyStatus,
        paymentStatus: req.body.paymentStatus || initialAxes.legacyPaymentStatus,
        lifecycleStatus: initialAxes.lifecycleStatus,
        providerDecision: initialAxes.providerDecision,
        paymentState: initialAxes.paymentState,
        refundState: initialAxes.refundState,
        disputeState: initialAxes.disputeState,
        fulfillmentState: initialAxes.fulfillmentState,
        entitlementState: initialAxes.entitlementState,
        settlementState: initialAxes.settlementState,
        providerResponseDeadline,
        documents: Array.isArray(req.body.documents) ? JSON.stringify(req.body.documents) : String(req.body.documents || '[]'),
        preApprovalSnapshot: preApproval,
        bookingPaymentPolicy: activePolicy,
        bookingPaymentPolicySnapshot: policySnapshotStr,
        periodSnapshot: periodSnapshotStr
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

      const updates = { ...req.body };
      if (updates.documents !== undefined) {
        updates.documents = Array.isArray(updates.documents) ? JSON.stringify(updates.documents) : String(updates.documents);
      }
      if (updates.preApprovalSnapshot !== undefined && typeof updates.preApprovalSnapshot === 'object') {
        updates.preApprovalSnapshot = JSON.stringify(updates.preApprovalSnapshot);
      }

      await item.update(updates);
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // 25b. Cancel Support Service Request
  cancelSupportRequest = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reason, actorId, actorRole = 'customer' } = req.body;
      const item = await this.repo.findSupportRequestByPk(id);
      if (!item) return res.status(404).json({ error: 'طلب الخدمة غير موجود' });

      await ServiceRequestStateMachine.transition(item, 'CANCEL', {
        actorId: actorId || (req.headers['x-user-id'] ? Number(req.headers['x-user-id']) : undefined),
        actorRole: actorRole || (req.headers['x-user-role'] as string) || 'customer',
        cancellationReason: reason || 'إلغاء طلب الخدمة من قبل العميل'
      });

      const io = req.app.get("io");
      if (io) {
        io.emit("service_request_status_updated", {
          requestId: item.id,
          requestNumber: (item as any).requestNumber,
          status: item.status,
          lifecycleStatus: (item as any).lifecycleStatus,
          cancellationReason: (item as any).cancellationReason
        });
      }

      res.json({
        success: true,
        message: 'تم إلغاء طلب الخدمة بنجاح.',
        item
      });
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
      } = req.body || {};
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
      console.error("Migration/Sync handled error:", err);
      res.json({ success: true, logs: [`تمت المزامنة جزئياً مع بعض التنبيهات: ${err.message}`] });
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

  // 41. P2 Lifecycle: Provider Accepts Booking
  acceptBooking = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { actorId, actorRole = 'provider', paymentDeadlineHours = 24 } = req.body;
      const booking = await this.repo.findBookingByPk(id);
      if (!booking) return res.status(404).json({ error: 'الحجز غير موجود' });

      // Execute State Machine Transition
      await BookingStateMachine.transition(booking, 'PROVIDER_ACCEPT', {
        actorId: actorId || (req.headers['x-user-id'] ? Number(req.headers['x-user-id']) : undefined),
        actorRole: actorRole || (req.headers['x-user-role'] as string) || 'provider',
        paymentDeadlineHours
      });

      const io = req.app.get("io");
      if (io) {
        io.emit("booking_status_updated", {
          bookingId: booking.id,
          bookingNumber: (booking as any).bookingNumber,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          paymentDeadline: (booking as any).paymentDeadline
        });
      }

      res.json({
        success: true,
        message: 'تم قبول الحجز بنجاح وفُتحت نافذة السداد للعميل.',
        booking
      });
    } catch (err: any) {
      console.error("Accept Booking Error:", err.message);
      res.status(400).json({ error: err.message || 'فشل قبول الحجز' });
    }
  };

  // 42. P2 Lifecycle: Provider Rejects Booking
  rejectBooking = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { rejectionReason, actorId, actorRole = 'provider' } = req.body;
      const booking = await this.repo.findBookingByPk(id);
      if (!booking) return res.status(404).json({ error: 'الحجز غير موجود' });

      await BookingStateMachine.transition(booking, 'PROVIDER_REJECT', {
        rejectionReason: rejectionReason || 'اعتذار المزود عن قبول الحجز في هذا التوقيت',
        actorId: actorId || (req.headers['x-user-id'] ? Number(req.headers['x-user-id']) : undefined),
        actorRole: actorRole || (req.headers['x-user-role'] as string) || 'provider'
      });

      const io = req.app.get("io");
      if (io) {
        io.emit("booking_status_updated", {
          bookingId: booking.id,
          bookingNumber: (booking as any).bookingNumber,
          status: booking.status,
          rejectionReason: (booking as any).rejectionReason
        });
      }

      res.json({
        success: true,
        message: 'تم تسجيل اعتذار المزود وإغلاق طلب الحجز دون خصم أي مبالغ.',
        booking
      });
    } catch (err: any) {
      console.error("Reject Booking Error:", err.message);
      res.status(400).json({ error: err.message || 'فشل رفض الحجز' });
    }
  };

  // 43. P2 Lifecycle: Provider Accepts Support Service Request
  acceptSupportRequest = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { actorId, actorRole = 'provider', paymentDeadlineHours = 24 } = req.body;
      const request = await this.repo.findSupportRequestByPk(id);
      if (!request) return res.status(404).json({ error: 'طلب الخدمة غير موجود' });

      await ServiceRequestStateMachine.transition(request, 'PROVIDER_ACCEPT', {
        actorId: actorId || (req.headers['x-user-id'] ? Number(req.headers['x-user-id']) : undefined),
        actorRole: actorRole || (req.headers['x-user-role'] as string) || 'provider',
        paymentDeadlineHours
      });

      const io = req.app.get("io");
      if (io) {
        io.emit("service_request_status_updated", {
          requestId: request.id,
          requestNumber: (request as any).requestNumber,
          status: request.status,
          paymentStatus: request.paymentStatus,
          paymentDeadline: (request as any).paymentDeadline
        });
      }

      res.json({
        success: true,
        message: 'تم قبول طلب الخدمة بنجاح وفُتحت نافذة السداد للعميل.',
        request
      });
    } catch (err: any) {
      console.error("Accept Support Request Error:", err.message);
      res.status(400).json({ error: err.message || 'فشل قبول طلب الخدمة' });
    }
  };

  // 44. P2 Lifecycle: Provider Rejects Support Service Request
  rejectSupportRequest = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { rejectionReason, actorId, actorRole = 'provider' } = req.body;
      const request = await this.repo.findSupportRequestByPk(id);
      if (!request) return res.status(404).json({ error: 'طلب الخدمة غير موجود' });

      await ServiceRequestStateMachine.transition(request, 'PROVIDER_REJECT', {
        rejectionReason: rejectionReason || 'اعتذار مزود الخدمة عن تلبية الطلب في هذا التوقيت',
        actorId: actorId || (req.headers['x-user-id'] ? Number(req.headers['x-user-id']) : undefined),
        actorRole: actorRole || (req.headers['x-user-role'] as string) || 'provider'
      });

      const io = req.app.get("io");
      if (io) {
        io.emit("service_request_status_updated", {
          requestId: request.id,
          requestNumber: (request as any).requestNumber,
          status: request.status,
          rejectionReason: (request as any).rejectionReason
        });
      }

      res.json({
        success: true,
        message: 'تم تسجيل اعتذار مزود الخدمة وإغلاق الطلب دون أي التزامات مالية.',
        request
      });
    } catch (err: any) {
      console.error("Reject Support Request Error:", err.message);
      res.status(400).json({ error: err.message || 'فشل رفض طلب الخدمة' });
    }
  };

  // 45. P2 Lifecycle: Customer Pays Post-Acceptance (Simulated or Gateway callback)
  payBooking = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { paymentReference = `PAY-${Date.now()}`, paymentMethod = 'mada', amount } = req.body;
      const booking = await this.repo.findBookingByPk(id);
      if (!booking) return res.status(404).json({ error: 'الحجز غير موجود' });

      const check = BookingStateMachine.isPaymentCheckoutAllowed(booking as any);
      if (!check.allowed) {
        return res.status(403).json({ error: check.reason, code: 'PAYMENT_NOT_ELIGIBLE' });
      }

      await BookingStateMachine.transition(booking, 'PAYMENT_CAPTURED', {
        paymentReference,
        paymentMethod,
        paidAmount: amount || Number(booking.totalAmount)
      });

      await awardLoyaltyPointsForBooking(booking);

      const io = req.app.get("io");
      if (io) {
        io.emit("booking_status_updated", {
          bookingId: booking.id,
          bookingNumber: (booking as any).bookingNumber,
          status: booking.status,
          paymentStatus: booking.paymentStatus
        });
      }

      res.json({
        success: true,
        message: 'تم سداد الحجز وتأكيده رسمياً بنجاح.',
        booking
      });
    } catch (err: any) {
      console.error("Pay Booking Error:", err.message);
      res.status(400).json({ error: err.message || 'فشل سداد الحجز' });
    }
  };

  // 46. P2 Lifecycle: Customer Pays Service Request Post-Acceptance
  paySupportRequest = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { paymentReference = `PAY-SRV-${Date.now()}`, paymentMethod = 'mada', amount } = req.body;
      const request = await this.repo.findSupportRequestByPk(id);
      if (!request) return res.status(404).json({ error: 'طلب الخدمة غير موجود' });

      const check = ServiceRequestStateMachine.isPaymentCheckoutAllowed(request as any);
      if (!check.allowed) {
        return res.status(403).json({ error: check.reason, code: 'PAYMENT_NOT_ELIGIBLE' });
      }

      await ServiceRequestStateMachine.transition(request, 'PAYMENT_CAPTURED', {
        paymentReference,
        paymentMethod,
        paidAmount: amount || Number(request.price)
      });

      const io = req.app.get("io");
      if (io) {
        io.emit("service_request_status_updated", {
          requestId: request.id,
          requestNumber: (request as any).requestNumber,
          status: request.status,
          paymentStatus: request.paymentStatus
        });
      }

      res.json({
        success: true,
        message: 'تم سداد طلب الخدمة وتأكيده رسمياً بنجاح.',
        request
      });
    } catch (err: any) {
      console.error("Pay Support Request Error:", err.message);
      res.status(400).json({ error: err.message || 'فشل سداد طلب الخدمة' });
    }
  };

  // 47. P2 Lifecycle: Automated Deadline & Expiry Checker (P2.5)
  checkDeadlines = async (req: Request, res: Response) => {
    try {
      const now = new Date();
      let expiredProviderDecisions = 0;
      let expiredPayments = 0;

      const io = req.app ? req.app.get("io") : null;

      // Check Bookings
      const pendingBookings = await this.repo.findBookings({
        where: {
          [Op.or]: [
            { status: { [Op.in]: ['pending', 'AWAITING_PROVIDER_DECISION', 'REQUESTED', 'PROVIDER_ACCEPTED', 'AWAITING_PAYMENT', 'معتمد - بانتظار السداد'] } },
            { lifecycleStatus: { [Op.in]: ['REQUESTED', 'AWAITING_PROVIDER', 'PROVIDER_ACCEPTED', 'AWAITING_PAYMENT'] } }
          ]
        }
      });

      for (const b of pendingBookings) {
        const rawStatus = b.status;
        const lifecycle = (b as any).lifecycleStatus || rawStatus;
        const provDecision = (b as any).providerDecision;
        const provDeadline = (b as any).providerResponseDeadline;
        const payDeadline = (b as any).paymentDeadline;

        // Provider Decision Timeout
        const isAwaitingProvider = (provDecision === 'PENDING') ||
          rawStatus === 'pending' || rawStatus === 'AWAITING_PROVIDER_DECISION' || rawStatus === 'REQUESTED' ||
          lifecycle === 'REQUESTED' || lifecycle === 'AWAITING_PROVIDER';

        if (isAwaitingProvider && provDeadline && new Date(provDeadline) < now) {
          try {
            await BookingStateMachine.transition(b, 'PROVIDER_TIMEOUT');
            expiredProviderDecisions++;
            if (io) {
              io.emit("booking_status_updated", {
                bookingId: b.id,
                bookingNumber: (b as any).bookingNumber,
                status: b.status,
                lifecycleStatus: (b as any).lifecycleStatus,
                rejectionReason: 'انتهت مهلة استجابة المزود المحددة نظاماً'
              });
            }
          } catch (e) {}
        }

        // Payment Expiry Timeout
        const isAwaitingPayment = rawStatus === 'PROVIDER_ACCEPTED' || rawStatus === 'AWAITING_PAYMENT' || rawStatus === 'معتمد - بانتظار السداد' ||
          lifecycle === 'PROVIDER_ACCEPTED' || lifecycle === 'AWAITING_PAYMENT';

        if (isAwaitingPayment && payDeadline && new Date(payDeadline) < now) {
          try {
            await BookingStateMachine.transition(b, 'PAYMENT_EXPIRED');
            expiredPayments++;
            if (io) {
              io.emit("booking_status_updated", {
                bookingId: b.id,
                bookingNumber: (b as any).bookingNumber,
                status: b.status,
                lifecycleStatus: (b as any).lifecycleStatus,
                paymentStatus: b.paymentStatus,
                rejectionReason: 'انتهت مهلة سداد الحجز المحددة بعد قبول المزود'
              });
            }
          } catch (e) {}
        }
      }

      // Check Service Requests
      const pendingServices = await this.repo.findSupportRequests({
        where: {
          [Op.or]: [
            { status: { [Op.in]: ['pending', 'AWAITING_PROVIDER_DECISION', 'REQUESTED', 'PROVIDER_ACCEPTED', 'AWAITING_PAYMENT', 'معتمد - بانتظار السداد'] } },
            { lifecycleStatus: { [Op.in]: ['REQUESTED', 'AWAITING_PROVIDER', 'PROVIDER_ACCEPTED', 'AWAITING_PAYMENT'] } }
          ]
        }
      });

      for (const s of pendingServices) {
        const rawStatus = s.status;
        const lifecycle = (s as any).lifecycleStatus || rawStatus;
        const provDecision = (s as any).providerDecision;
        const provDeadline = (s as any).providerResponseDeadline;
        const payDeadline = (s as any).paymentDeadline;

        const isAwaitingProvider = (provDecision === 'PENDING') ||
          rawStatus === 'pending' || rawStatus === 'AWAITING_PROVIDER_DECISION' || rawStatus === 'REQUESTED' ||
          lifecycle === 'REQUESTED' || lifecycle === 'AWAITING_PROVIDER';

        if (isAwaitingProvider && provDeadline && new Date(provDeadline) < now) {
          try {
            await ServiceRequestStateMachine.transition(s, 'PROVIDER_TIMEOUT');
            expiredProviderDecisions++;
            if (io) {
              io.emit("service_request_status_updated", {
                requestId: s.id,
                requestNumber: (s as any).requestNumber,
                status: s.status,
                lifecycleStatus: (s as any).lifecycleStatus,
                rejectionReason: 'انتهت مهلة استجابة مزود الخدمة المحددة نظاماً'
              });
            }
          } catch (e) {}
        }

        const isAwaitingPayment = rawStatus === 'PROVIDER_ACCEPTED' || rawStatus === 'AWAITING_PAYMENT' || rawStatus === 'معتمد - بانتظار السداد' ||
          lifecycle === 'PROVIDER_ACCEPTED' || lifecycle === 'AWAITING_PAYMENT';

        if (isAwaitingPayment && payDeadline && new Date(payDeadline) < now) {
          try {
            await ServiceRequestStateMachine.transition(s, 'PAYMENT_EXPIRED');
            expiredPayments++;
            if (io) {
              io.emit("service_request_status_updated", {
                requestId: s.id,
                requestNumber: (s as any).requestNumber,
                status: s.status,
                lifecycleStatus: (s as any).lifecycleStatus,
                paymentStatus: s.paymentStatus,
                rejectionReason: 'انتهت مهلة سداد طلب الخدمة المحددة بعد قبول المزود'
              });
            }
          } catch (e) {}
        }
      }

      res.json({
        success: true,
        checkedAt: now.toISOString(),
        expiredProviderDecisions,
        expiredPayments
      });
    } catch (err: any) {
      console.error("Check Deadlines Error:", err);
      res.status(500).json({ error: err.message });
    }
  };

  // 47b. Get Timeline / Audit Trail for Booking (P2.1)
  getBookingTimeline = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const logs = await LifecycleAuditLog.findAll({
        where: {
          aggregateType: 'Booking',
          aggregateId: String(id)
        },
        order: [['timestamp', 'ASC']]
      });

      const events = await DomainEvent.findAll({
        where: {
          aggregateType: 'Booking',
          aggregateId: String(id)
        },
        order: [['createdAt', 'ASC']]
      });

      res.json({
        success: true,
        bookingId: id,
        auditLogs: logs,
        events
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  // 47c. Get Timeline / Audit Trail for Support Request (P2.1)
  getSupportRequestTimeline = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const logs = await LifecycleAuditLog.findAll({
        where: {
          aggregateType: 'SupportServiceRequest',
          aggregateId: String(id)
        },
        order: [['timestamp', 'ASC']]
      });

      const events = await DomainEvent.findAll({
        where: {
          aggregateType: 'SupportServiceRequest',
          aggregateId: String(id)
        },
        order: [['createdAt', 'ASC']]
      });

      res.json({
        success: true,
        requestId: id,
        auditLogs: logs,
        events
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  // 46. Get Allowed Booking Policies for Provider (P1.9)
  getProviderAllowedPolicies = async (req: Request, res: Response) => {
    try {
      const providerId = Number(req.query.providerId || req.headers['x-user-id'] || 0);
      const allowed = await bookingPolicyService.getAllowedBookingPolicies(providerId);
      
      const policiesWithMeta = allowed.map(p => ({
        policy: p,
        metadata: BOOKING_POLICY_DEFINITIONS[p] || {
          policy: p,
          nameAr: p,
          descriptionAr: '',
          isSafeDefault: p === 'APPROVAL_BEFORE_PAYMENT'
        }
      }));

      res.json({
        providerId,
        allowedPolicies: allowed,
        policies: policiesWithMeta,
        allDefinitions: BOOKING_POLICY_DEFINITIONS
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  // 47. Update Hall Booking Payment Policy (DEPRECATED in P1.9 cleanup)
  // Per-resource overrides are deprecated. Policy is unified at the provider level: PUT /api/bookings/policies/provider-settings
  updateHallBookingPolicy = async (req: Request, res: Response) => {
    return res.status(410).json({
      error: 'تم إلغاء تخصيص سياسة الحجز لكل قاعة أو مكان بشكل منفرد. يتم ضبط سياسة الحجز الموحدة لجميع أماكن المزود عبر إعدادات المزود: PUT /api/bookings/policies/provider-settings',
      code: 'RESOURCE_POLICY_DEPRECATED',
      deprecated: true,
      alternativeEndpoint: '/api/bookings/policies/provider-settings'
    });
  };

  // 48. Update Service Booking Payment Policy (DEPRECATED in P1.9 cleanup)
  // Per-resource overrides are deprecated. Policy is unified at the provider level: PUT /api/bookings/policies/provider-settings
  updateServiceBookingPolicy = async (req: Request, res: Response) => {
    return res.status(410).json({
      error: 'تم إلغاء تخصيص سياسة الحجز لكل خدمة منفردة. يتم ضبط سياسة الحجز الموحدة لجميع خدمات المزود المستقلة عبر إعدادات المزود: PUT /api/bookings/policies/provider-settings',
      code: 'RESOURCE_POLICY_DEPRECATED',
      deprecated: true,
      alternativeEndpoint: '/api/bookings/policies/provider-settings'
    });
  };

  // 49. Get Unified Provider Booking Policy Settings (P1.9 Revised)
  getProviderPolicySettings = async (req: Request, res: Response) => {
    try {
      const providerId = Number(req.query.providerId || req.headers['x-user-id'] || 0);
      const provider = await User.findByPk(providerId);

      const allowedPolicies = await bookingPolicyService.getAllowedBookingPolicies(providerId);
      const canControlDeadline = await bookingPolicyService.canProviderControlDeadline(providerId);
      const sovereignConfig = await bookingPolicyService.getSovereignPolicyConfig();

      const venueBookingPolicy = (provider as any)?.venueBookingPolicy || 'INSTANT_CONFIRMATION';
      const independentServiceBookingPolicy = (provider as any)?.independentServiceBookingPolicy || 'INSTANT_CONFIRMATION';
      const providerResponseDeadlineHours = (provider as any)?.providerResponseDeadlineHours || 1;

      res.json({
        success: true,
        providerId,
        venueBookingPolicy,
        independentServiceBookingPolicy,
        providerResponseDeadlineHours,
        allowedPolicies,
        canControlDeadline,
        sovereignConfig,
        allDefinitions: BOOKING_POLICY_DEFINITIONS
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  // 50. Update Unified Provider Booking Policy Settings (P1.9 Revised)
  updateProviderPolicySettings = async (req: Request, res: Response) => {
    try {
      const providerId = Number(req.body.providerId || req.headers['x-user-id'] || 0);
      const { venueBookingPolicy, independentServiceBookingPolicy, providerResponseDeadlineHours } = req.body;

      const actorId = Number(req.headers['x-user-id']) || providerId;
      const actorRole = (req as any).user?.role || (req.headers['x-user-role'] as string) || 'provider';

      const result = await bookingPolicyService.updateProviderPolicySettings({
        providerId,
        venueBookingPolicy,
        independentServiceBookingPolicy,
        providerResponseDeadlineHours,
        actorId,
        actorRole
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error
        });
      }

      res.json({
        success: true,
        message: 'تم تحديث سياسات الحجز والدفع الموحدة بنجاح',
        data: result
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  // ==========================================
  // P2.2 - Booking Hold & Lock Endpoints
  // ==========================================

  // 51. Acquire Atomic Period Hold
  acquireHold = async (req: Request, res: Response) => {
    try {
      const { hallId, date, period, sessionId } = req.body;
      const userId = req.headers['x-user-id'] ? Number(req.headers['x-user-id']) : req.body.userId || null;

      const result = await BookingHoldService.acquireHold({
        hallId,
        date,
        period,
        userId,
        sessionId
      });

      if (!result.success) {
        return res.status(409).json({
          success: false,
          error: result.error,
          errorCode: result.errorCode
        });
      }

      res.status(201).json({
        success: true,
        message: 'تم حجز الفترة مؤقتاً بنجاح',
        holdToken: result.holdToken,
        expiresAt: result.expiresAt,
        ttlSeconds: result.ttlSeconds,
        policy: result.policy
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  // 52. Verify Hold Status
  verifyHold = async (req: Request, res: Response) => {
    try {
      const { holdToken, hallId, date, period } = req.query;
      const result = await BookingHoldService.verifyHold(
        String(holdToken || ''),
        Number(hallId || 0),
        String(date || ''),
        String(period || '')
      );

      res.json({
        success: result.isValid,
        isValid: result.isValid,
        hold: result.hold,
        reason: result.reason
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  // 53. Release Hold Manually
  releaseHold = async (req: Request, res: Response) => {
    try {
      const { holdToken } = req.body;
      const released = await BookingHoldService.releaseHold(String(holdToken || ''));
      res.json({
        success: released,
        message: released ? 'تم تحرير الحجز المؤقت' : 'لم يتم العثور على الحجز المؤقت أو تم تحريره مسبقاً'
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  // 54. Get Blocked Dates (Unified for Provider & Admin)
  getBlockedDates = async (req: Request, res: Response) => {
    try {
      const { entityId, entityType = 'hall', providerId } = req.query;
      const whereClause: any = { status: 'active' };

      if (entityId) whereClause.entityId = Number(entityId);
      if (entityType) whereClause.entityType = String(entityType);
      if (providerId) whereClause.providerId = Number(providerId);

      const blocks = await ExternalBlockedDate.findAll({
        where: whereClause,
        order: [['startDate', 'ASC']]
      });

      res.json({
        success: true,
        blocks
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  // 55. Create Blocked Date
  createBlockedDate = async (req: Request, res: Response) => {
    try {
      const {
        entityId,
        entityType = 'hall',
        entityName,
        providerId,
        providerName,
        startDate,
        endDate,
        period = 'يوم كامل',
        blockType = 'manual',
        reason,
        internalNotes
      } = req.body;

      const currentYear = new Date().getFullYear();
      const yy = String(currentYear).slice(-2);
      const count = await ExternalBlockedDate.count();
      const blockId = `BLK-${yy}-${String(count + 1).padStart(10, '0')}`;

      const block = await ExternalBlockedDate.create({
        blockId,
        entityId: Number(entityId),
        entityType: String(entityType),
        entityName: entityName || 'مكان',
        providerId: providerId ? Number(providerId) : null,
        providerName: providerName || null,
        startDate: PeriodConflictService.normalizeDate(startDate),
        endDate: PeriodConflictService.normalizeDate(endDate || startDate),
        period: String(period),
        blockType: String(blockType),
        reason: reason || null,
        internalNotes: internalNotes || null,
        source: 'manual',
        status: 'active',
        createdBy: req.headers['x-user-id'] ? String(req.headers['x-user-id']) : 'provider'
      });

      res.status(201).json({
        success: true,
        message: 'تم حظر التاريخ والفترة بنجاح',
        block
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  // 56. Remove / Unblock Date
  deleteBlockedDate = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const block = await ExternalBlockedDate.findByPk(Number(id));
      if (!block) {
        return res.status(404).json({ success: false, error: 'سجل الحظر غير موجود' });
      }

      block.status = 'unblocked';
      block.unblockedAt = new Date();
      block.unblockedBy = req.headers['x-user-id'] ? String(req.headers['x-user-id']) : 'provider';
      await block.save();

      res.json({
        success: true,
        message: 'تم إلغاء حظر التاريخ بنجاح'
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  // 57. P2.3-P2.4 Get Admin Sovereign Regulatory Periods & Deadlines Configuration
  getRegulatoryPeriodsConfig = async (req: Request, res: Response) => {
    try {
      const config = await regulatoryPeriodService.getRegulatoryConfig();
      res.json({
        success: true,
        config
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  // 58. P2.3-P2.4 Update Admin Sovereign Regulatory Periods & Deadlines Configuration
  updateRegulatoryPeriodsConfig = async (req: Request, res: Response) => {
    try {
      const actorId = Number(req.headers['x-user-id']) || 0;
      const actorName = (req.headers['x-user-name'] as string) || (req as any).user?.name || 'admin';
      const { morning, evening, deadlines, reason, effectiveFrom } = req.body;

      const result = await regulatoryPeriodService.updateRegulatoryConfig({
        morning,
        evening,
        deadlines,
        reason,
        effectiveFrom,
        actorId,
        actorName
      });

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  // 59. P2.3-P2.4 Get Audit History for Regulatory Timing Changes
  getRegulatoryAuditHistory = async (req: Request, res: Response) => {
    try {
      const limit = Number(req.query.limit) || 20;
      const logs = await regulatoryPeriodService.getAuditHistory(limit);
      res.json({
        success: true,
        logs
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
}

