import { BookingRepository } from '../booking.repository.js';
import { Hall, Service, Booking, SupportServiceRequest } from '../../../models/BookingModels.js';
import { User, PlatformConfig } from '../../../models/UserModels.js';
import { Ticket, syncSupportModels } from '../../../models/SupportModels.js';
import { syncHallExtraServicesTable } from '../booking.helpers.js';

export class SyncMigrationUseCase {
  constructor(private repo: BookingRepository) {}

  async execute(
    clientHalls?: any[],
    clientServices?: any[],
    clientBookings?: any[],
    clientSupportTickets?: any[],
    clientSupportRequests?: any[],
    clientRegions?: any[]
  ) {
    const logs: string[] = [];

    // 1. Migrate Halls
    if (Array.isArray(clientHalls) && clientHalls.length > 0) {
      let insertedHalls = 0;
      let updatedHalls = 0;
      for (const h of clientHalls) {
        if (!h.name) continue;

        let hall = await Hall.findOne({ where: { name: h.name } });

        let resolvedProviderId: number | null = null;
        if (h.providerId) {
          const numStr = String(h.providerId).replace(/[^\d]/g, '');
          if (numStr) {
            resolvedProviderId = Number(numStr);
          }
        }
        if (!resolvedProviderId && h.provider) {
          const user = await User.findOne({ where: { name: h.provider } });
          if (user) {
            resolvedProviderId = user.id;
          }
        }

        const body: any = {
          name: h.name,
          type: h.type || h.category || 'قاعة أفراح',
          description: h.description || '',
          contractTerms: h.contractTerms || '',
          capacity: Number(h.capacity || 100),
          hourlyRate: Number(h.hourlyRate || h.price || 0),
          status: h.status || 'approved',
          activationStatus: h.activationStatus || 'مفعل',
          city: h.city || 'الرياض',
          category: h.category || 'قاعة أفراح',
          price: Number(h.price || h.fullDayPrice || 0),
          rating: Number(h.rating || 4.5),
          image: h.image || '',
          images: Array.isArray(h.images) ? JSON.stringify(h.images) : String(h.images || '[]'),
          location: h.location || '',
          provider: h.provider || '',
          features: Array.isArray(h.features) ? JSON.stringify(h.features) : String(h.features || '[]'),
          rules: Array.isArray(h.rules) ? JSON.stringify(h.rules) : String(h.rules || '[]'),
          extraServicesList: Array.isArray(h.extraServicesList) ? JSON.stringify(h.extraServicesList) : String(h.extraServicesList || '[]'),
          featured: !!h.featured,
          nightPrice: Number(h.nightPrice || 0),
          morningPrice: Number(h.morningPrice || 0),
          fullDayPrice: Number(h.fullDayPrice || h.price || 0),
          phone: h.phone || '',
          email: h.email || '',
          region: h.region || '',
          nationalAddress: h.nationalAddress || '',
          extraAddress: h.extraAddress || '',
          providerType: h.providerType || 'منشأة تجارية',
          crNumber: h.crNumber || '',
          crExpiryDate: h.crExpiryDate || '',
          taxNumber: h.taxNumber || '',
          bookingStatus: h.bookingStatus || 'متاحة',
          facilities: h.facilities || '',
          cancellationPeriod: h.cancellationPeriod ? Number(h.cancellationPeriod) : null,
          providerId: resolvedProviderId,
          taxExempt: !!h.taxExempt,
          paymentMethod: Array.isArray(h.paymentMethods) ? JSON.stringify(h.paymentMethods) : String(h.paymentMethod || '[]'),
          pledgeAccepted: !!h.pledgeAccepted,
          crImage: h.crImage || '',
          ibanImage: h.ibanImage || '',
          taxCertificateImage: h.taxCertificateImage || '',
          zakatCertificateImage: h.zakatCertificateImage || '',
          tourismLicenseImage: h.tourismLicenseImage || '',
          bookingType: h.bookingType || 'alacarte',
          packagesList: Array.isArray(h.packagesList) ? JSON.stringify(h.packagesList) : String(h.packagesList || '[]')
        };

        let savedHall;
        if (hall) {
          delete body.status;
          delete body.activationStatus;
          await hall.update(body);
          savedHall = hall;
          updatedHalls++;
        } else {
          savedHall = await Hall.create(body);
          insertedHalls++;
        }

        let extraServices = [];
        if (h.extraServicesList) {
          try {
            extraServices = typeof h.extraServicesList === 'string' ? JSON.parse(h.extraServicesList) : h.extraServicesList;
          } catch (e) {}
        }
        await syncHallExtraServicesTable(savedHall.id, extraServices, savedHall.providerId);
      }
      logs.push(`✅ تم ترحيل/تحديث ${insertedHalls + updatedHalls} من القاعات المحلية (${insertedHalls} جديد، ${updatedHalls} تحديث) بنجاح.`);
    }

    // 2. Migrate Services
    if (Array.isArray(clientServices) && clientServices.length > 0) {
      let insertedServices = 0;
      let updatedServices = 0;
      for (const s of clientServices) {
        if (!s.name) continue;

        let service = await Service.findOne({ where: { name: s.name } });

        let resolvedProviderId: number | null = null;
        if (s.providerId) {
          const numStr = String(s.providerId).replace(/[^\d]/g, '');
          if (numStr) {
            resolvedProviderId = Number(numStr);
          }
        }
        if (!resolvedProviderId && s.provider) {
          const user = await User.findOne({ where: { name: s.provider } });
          if (user) {
            resolvedProviderId = user.id;
          }
        }

        const body: any = {
          name: s.name,
          description: s.description || '',
          quantity: s.quantity === '' ? null : Number(s.quantity || s.quantityLimit || null),
          price: Number(s.price || 0),
          provider: s.provider || '',
          providerId: resolvedProviderId,
          showProviderToCustomers: !!s.showProviderToCustomers,
          regions: s.regions || '',
          cities: s.cities || '',
          terms: s.terms || '',
          serviceStatus: s.serviceStatus || 'متاحة',
          adminStatus: s.adminStatus || 'فعالة',
          status: s.status || 'approved',
          activationStatus: s.activationStatus || 'مفعل',
          cancellationPeriod: s.cancellationPeriod ? Number(s.cancellationPeriod) : null,
          images: Array.isArray(s.images) ? JSON.stringify(s.images) : (typeof s.images === 'string' ? s.images : (s.image ? JSON.stringify([s.image]) : '[]')),
          hostName: s.hostName || s.provider || '',
          unit: s.unit || 'مرة واحدة',
          unitPrice: Number(s.unitPrice || s.price || 0),
          taxonomyType: s.taxonomyType || 'rental',
          packages: Array.isArray(s.packages) ? JSON.stringify(s.packages) : String(s.packages || '[]'),
          addons: Array.isArray(s.addons) ? JSON.stringify(s.addons) : String(s.addons || '[]'),
          classification: s.classification || s.category || null
        };

        if (service) {
          delete body.status;
          delete body.activationStatus;
          delete body.adminStatus;
          await service.update(body);
          updatedServices++;
        } else {
          await Service.create(body);
          insertedServices++;
        }
      }
      logs.push(`✅ تم ترحيل/تحديث ${insertedServices + updatedServices} من الخدمات المساندة المحلية (${insertedServices} جديد، ${updatedServices} تحديث) بنجاح.`);
    }

    // 3. Migrate Bookings
    if (Array.isArray(clientBookings) && clientBookings.length > 0) {
      let insertedBookings = 0;
      for (const b of clientBookings) {
        const cName = b.customer || b.customerName || '';
        const cPhone = b.phone || b.customerPhone || '';
        if (!cName && !cPhone) continue;

        const existing = await Booking.findOne({
          where: {
            customerName: cName,
            customerPhone: cPhone
          }
        });

        if (!existing) {
          let hallId = 1;
          if (b.hall) {
            const matchedHall = await Hall.findOne({ where: { name: b.hall } });
            if (matchedHall) hallId = matchedHall.id;
          }

          let mappedStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed' = 'pending';
          if (b.status === 'مؤكد' || b.status === 'confirmed') mappedStatus = 'confirmed';
          else if (b.status === 'ملغي' || b.status === 'cancelled') mappedStatus = 'cancelled';
          else if (b.status === 'مكتمل' || b.status === 'completed') mappedStatus = 'completed';

          await Booking.create({
            customerName: cName,
            customerPhone: cPhone,
            hallId,
            startTime: b.date || b.startTime ? new Date(b.date || b.startTime) : new Date(),
            endTime: b.endTime ? new Date(b.endTime) : new Date(Date.now() + 86400000),
            guests: Number(b.guests || 100),
            totalAmount: Number(b.totalAmount || b.amount || 0),
            status: mappedStatus,
            userId: b.userId || null,
            customerEmail: b.email || b.customerEmail || null,
            bookingType: b.bookingType || 'alacarte',
            packageName: b.packageName || null,
            selectedAddons: typeof b.selectedAddons === 'string' ? b.selectedAddons : JSON.stringify(b.selectedAddons || []),
            externalServices: typeof b.externalServices === 'string' ? b.externalServices : JSON.stringify(b.externalServices || []),
            subTotal: Number(b.subTotal || b.amount || 0),
            taxAmount: Number(b.taxAmount || 0),
            depositAmount: Number(b.depositAmount || 0),
            paymentMethod: b.paymentMethod || 'online',
            paymentStatus: b.paymentStatus || 'pending'
          });
          insertedBookings++;
        }
      }
      if (insertedBookings > 0) {
        logs.push(`✅ تم ترحيل ${insertedBookings} حجز غير موجود من البيانات المحلية إلى قاعدة البيانات السحابية.`);
      }
    }

    // 4. Migrate Support Requests
    if (Array.isArray(clientSupportRequests) && clientSupportRequests.length > 0) {
      let insertedReqs = 0;
      for (const r of clientSupportRequests) {
        if (!r.serviceName) continue;
        const existing = await SupportServiceRequest.findOne({
          where: {
            serviceName: r.serviceName,
            customerName: r.customerName || ''
          }
        });
        if (!existing) {
          await SupportServiceRequest.create({
            bookingId: r.bookingId || null,
            customerName: r.customerName || '',
            providerName: r.providerName || '',
            serviceName: r.serviceName || '',
            price: Number(r.price || 0),
            date: r.date || new Date().toISOString().split('T')[0],
            status: r.status || 'قيد الانتظار',
            customerId: r.customerId || null,
            providerId: r.providerId || null,
            serviceId: r.serviceId || null
          });
          insertedReqs++;
        }
      }
      if (insertedReqs > 0) {
        logs.push(`✅ تم ترحيل ${insertedReqs} طلب دعم مساند إلى قاعدة البيانات السحابية.`);
      }
    }

    // 5. Migrate Support Tickets
    if (Array.isArray(clientSupportTickets) && clientSupportTickets.length > 0) {
      let insertedTickets = 0;
      try {
        await syncSupportModels();
      } catch (e) {
        console.warn("syncSupportModels error during migration:", e);
      }

      for (const t of clientSupportTickets) {
        if (!t.title) continue;
        try {
          const existing = await Ticket.findOne({ where: { title: t.title } });
          if (!existing) {
            const ticketData: any = {
              title: t.title,
              description: t.description || t.title,
              status: t.status === 'مفتوحة' ? 'مفتوحة' : 'مغلقة',
              priority: t.priority === 'عالية جدا' ? 'عالية جدا' : (t.priority === 'عالية' ? 'عالية' : 'متوسطة'),
              department: t.department || 'عام',
              customerId: t.customerId || 1,
              assignedAgentId: t.assignedAgentId || null,
              slaDeadline: t.slaDeadline ? new Date(t.slaDeadline) : new Date(Date.now() + 86400000)
            };
            
            if (typeof t.id === 'number' && !isNaN(t.id) && t.id > 0) {
              ticketData.id = t.id;
            }

            await Ticket.create(ticketData);
            insertedTickets++;
          }
        } catch (ticketErr) {
          console.error(`Error migrating ticket '${t.title}':`, ticketErr);
        }
      }
      if (insertedTickets > 0) {
        logs.push(`✅ تم ترحيل ${insertedTickets} تذكرة دعم إلى قاعدة البيانات السحابية.`);
      }
    }

    // 6. Migrate Regions and Cities to PlatformConfig
    if (Array.isArray(clientRegions) && clientRegions.length > 0) {
      const existingRegionsConfig = await PlatformConfig.findOne({ where: { key: 'SYSTEM_REGIONS' } });
      if (existingRegionsConfig) {
        await existingRegionsConfig.update({ value: JSON.stringify(clientRegions) });
      } else {
        await PlatformConfig.create({
          key: 'SYSTEM_REGIONS',
          value: JSON.stringify(clientRegions)
        });
      }

      const regionNames = clientRegions.map((r: any) => r.name);
      const allCities = clientRegions.flatMap((r: any) => r.cities || []);
      const uniqueCities = Array.from(new Set(allCities));

      const existingRegNames = await PlatformConfig.findOne({ where: { key: 'SYSTEM_DATastore_regions' } });
      if (existingRegNames) {
        await existingRegNames.update({ value: JSON.stringify(regionNames) });
      } else {
        await PlatformConfig.create({ key: 'SYSTEM_DATastore_regions', value: JSON.stringify(regionNames) });
      }

      const existingCities = await PlatformConfig.findOne({ where: { key: 'SYSTEM_DATastore_cities' } });
      if (existingCities) {
        await existingCities.update({ value: JSON.stringify(uniqueCities) });
      } else {
        await PlatformConfig.create({ key: 'SYSTEM_DATastore_cities', value: JSON.stringify(uniqueCities) });
      }

      logs.push(`✅ تم حفظ وترحيل المناطق والمدن الجغرافية إلى قاعدة البيانات السحابية بنجاح.`);
    }

    return { success: true, logs };
  }
}

