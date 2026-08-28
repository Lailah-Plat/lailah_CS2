import { BookingRepository } from '../booking.repository.js';
import { Hall, Service, Booking, SupportServiceRequest, HallExtraServices } from '../../../models/BookingModels.js';
import { User, PlatformConfig } from '../../../models/UserModels.js';
import { Ticket, syncSupportModels } from '../../../models/SupportModels.js';
import { syncHallExtraServicesTable } from '../booking.helpers.js';

/**
 * Safe helper to parse a finite number with a fallback
 */
function toSafeNumber(val: any, defaultVal = 0): number {
  if (val === null || val === undefined || val === '') return defaultVal;
  const n = Number(val);
  return isNaN(n) || !isFinite(n) ? defaultVal : n;
}

/**
 * Safe helper to parse a nullable integer
 */
function toSafeInt(val: any, defaultVal: number | null = null): number | null {
  if (val === null || val === undefined || val === '') return defaultVal;
  const n = parseInt(String(val).replace(/[^\d\-]/g, ''), 10);
  return isNaN(n) || !isFinite(n) ? defaultVal : n;
}

/**
 * Safe helper to extract numeric ID from strings like 'PRV-123', 'CUST-001', 'BKG-26-0000000001', etc.
 */
function extractNumericId(val: any): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  if (typeof val === 'string') {
    const digitsOnly = val.replace(/[^\d]/g, '');
    if (digitsOnly.length > 0) {
      const parsed = parseInt(digitsOnly, 10);
      return isNaN(parsed) ? null : parsed;
    }
  }
  return null;
}

/**
 * Safe helper to validate and parse a Date
 */
function toSafeDate(val: any, defaultDate: Date = new Date()): Date {
  if (!val) return defaultDate;
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? defaultDate : d;
  } catch (e) {
    return defaultDate;
  }
}

/**
 * Safe helper for JSON serialization
 */
function toSafeJsonString(val: any, defaultVal = '[]'): string {
  if (val === null || val === undefined) return defaultVal;
  if (typeof val === 'string') {
    try {
      JSON.parse(val);
      return val;
    } catch {
      return JSON.stringify([val]);
    }
  }
  if (Array.isArray(val) || typeof val === 'object') {
    try {
      return JSON.stringify(val);
    } catch {
      return defaultVal;
    }
  }
  return defaultVal;
}

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
        if (!h || !h.name) continue;
        try {
          let hall = await Hall.findOne({ where: { name: String(h.name).trim() } });

          let resolvedProviderId: number | null = extractNumericId(h.providerId);
          if (!resolvedProviderId && h.provider) {
            try {
              const user = await User.findOne({ where: { name: String(h.provider).trim() } });
              if (user) {
                resolvedProviderId = user.id;
              }
            } catch (e) {
              // ignore user lookup error
            }
          }

          const body: any = {
            name: String(h.name).trim(),
            type: h.type || h.category || 'قاعة أفراح',
            description: h.description || '',
            contractTerms: h.contractTerms || '',
            capacity: toSafeNumber(h.capacity, 100),
            hourlyRate: toSafeNumber(h.hourlyRate || h.price, 0),
            status: h.status || 'approved',
            activationStatus: h.activationStatus || 'مفعل',
            city: h.city || 'الرياض',
            category: h.category || 'قاعة أفراح',
            price: toSafeNumber(h.price || h.fullDayPrice, 0),
            rating: toSafeNumber(h.rating, 4.5),
            image: h.image || '',
            images: toSafeJsonString(h.images),
            location: h.location || '',
            provider: h.provider || '',
            features: toSafeJsonString(h.features),
            rules: toSafeJsonString(h.rules),
            extraServicesList: toSafeJsonString(h.extraServicesList),
            featured: Boolean(h.featured),
            nightPrice: toSafeNumber(h.nightPrice, 0),
            morningPrice: toSafeNumber(h.morningPrice, 0),
            fullDayPrice: toSafeNumber(h.fullDayPrice || h.price, 0),
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
            facilities: typeof h.facilities === 'string' ? h.facilities : toSafeJsonString(h.facilities, ''),
            cancellationPeriod: toSafeInt(h.cancellationPeriod, null),
            providerId: resolvedProviderId,
            taxExempt: Boolean(h.taxExempt),
            paymentMethod: toSafeJsonString(h.paymentMethods || h.paymentMethod),
            pledgeAccepted: Boolean(h.pledgeAccepted),
            crImage: h.crImage || '',
            ibanImage: h.ibanImage || '',
            taxCertificateImage: h.taxCertificateImage || '',
            zakatCertificateImage: h.zakatCertificateImage || '',
            tourismLicenseImage: h.tourismLicenseImage || '',
            bookingType: h.bookingType || 'alacarte',
            packagesList: toSafeJsonString(h.packagesList)
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

          if (savedHall && savedHall.id) {
            let extraServices: any[] = [];
            if (h.extraServicesList) {
              try {
                extraServices = typeof h.extraServicesList === 'string' ? JSON.parse(h.extraServicesList) : h.extraServicesList;
              } catch (e) {
                extraServices = [];
              }
            }
            try {
              await syncHallExtraServicesTable(savedHall.id, extraServices, savedHall.providerId);
            } catch (errSync) {
              console.warn(`Warning syncing extra services for hall ${savedHall.id}:`, errSync);
            }
          }
        } catch (hallErr) {
          console.error(`Error migrating hall '${h.name}':`, hallErr);
        }
      }
      logs.push(`✅ تم ترحيل/تحديث ${insertedHalls + updatedHalls} من القاعات المحلية (${insertedHalls} جديد، ${updatedHalls} تحديث) بنجاح.`);
    }

    // 2. Migrate Services
    if (Array.isArray(clientServices) && clientServices.length > 0) {
      let insertedServices = 0;
      let updatedServices = 0;
      for (const s of clientServices) {
        if (!s || !s.name) continue;
        try {
          let service = await Service.findOne({ where: { name: String(s.name).trim() } });

          let resolvedProviderId: number | null = extractNumericId(s.providerId);
          if (!resolvedProviderId && s.provider) {
            try {
              const user = await User.findOne({ where: { name: String(s.provider).trim() } });
              if (user) {
                resolvedProviderId = user.id;
              }
            } catch (e) {
              // ignore user lookup error
            }
          }

          const body: any = {
            name: String(s.name).trim(),
            description: s.description || '',
            quantity: toSafeInt(s.quantity !== undefined ? s.quantity : s.quantityLimit, null),
            price: toSafeNumber(s.price, 0),
            provider: s.provider || '',
            providerId: resolvedProviderId,
            showProviderToCustomers: Boolean(s.showProviderToCustomers),
            regions: s.regions || '',
            cities: s.cities || '',
            terms: s.terms || '',
            serviceStatus: s.serviceStatus || 'متاحة',
            adminStatus: s.adminStatus || 'فعالة',
            status: s.status || 'approved',
            activationStatus: s.activationStatus || 'مفعل',
            cancellationPeriod: toSafeInt(s.cancellationPeriod, null),
            images: toSafeJsonString(s.images || (s.image ? [s.image] : [])),
            hostName: s.hostName || s.provider || '',
            unit: s.unit || 'مرة واحدة',
            unitPrice: toSafeNumber(s.unitPrice || s.price, 0),
            taxonomyType: s.taxonomyType || 'rental',
            packages: toSafeJsonString(s.packages),
            addons: toSafeJsonString(s.addons),
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
        } catch (serviceErr) {
          console.error(`Error migrating service '${s.name}':`, serviceErr);
        }
      }
      logs.push(`✅ تم ترحيل/تحديث ${insertedServices + updatedServices} من الخدمات المساندة المحلية (${insertedServices} جديد، ${updatedServices} تحديث) بنجاح.`);
    }

    // 3. Migrate Bookings
    if (Array.isArray(clientBookings) && clientBookings.length > 0) {
      let insertedBookings = 0;
      for (const b of clientBookings) {
        if (!b) continue;
        const cName = b.customer || b.customerName || '';
        const cPhone = b.phone || b.customerPhone || '0500000000';
        if (!cName && !b.id) continue;

        try {
          const existing = await Booking.findOne({
            where: {
              customerName: cName,
              customerPhone: cPhone
            }
          });

          if (!existing) {
            let hallId = 1;
            if (b.hall) {
              try {
                const matchedHall = await Hall.findOne({ where: { name: String(b.hall).trim() } });
                if (matchedHall) {
                  hallId = matchedHall.id;
                }
              } catch (e) {}
            } else if (b.hallId && extractNumericId(b.hallId)) {
              hallId = extractNumericId(b.hallId)!;
            } else {
              try {
                const anyHall = await Hall.findOne();
                if (anyHall) hallId = anyHall.id;
              } catch (e) {}
            }

            let mappedStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed' = 'pending';
            if (b.status === 'مؤكد' || b.status === 'confirmed') mappedStatus = 'confirmed';
            else if (b.status === 'ملغي' || b.status === 'cancelled') mappedStatus = 'cancelled';
            else if (b.status === 'مكتمل' || b.status === 'completed') mappedStatus = 'completed';

            const startDate = toSafeDate(b.date || b.startTime, new Date());
            const endDate = toSafeDate(b.endTime, new Date(startDate.getTime() + 86400000));

            await Booking.create({
              customerName: cName || 'عميل تجريبي',
              customerPhone: cPhone,
              hallId,
              startTime: startDate,
              endTime: endDate,
              guests: toSafeNumber(b.guests, 100),
              totalAmount: toSafeNumber(b.totalAmount || b.amount, 0),
              status: mappedStatus,
              userId: extractNumericId(b.userId),
              customerEmail: b.email || b.customerEmail || null,
              bookingType: b.bookingType || 'alacarte',
              packageName: b.packageName || null,
              selectedAddons: toSafeJsonString(b.selectedAddons),
              externalServices: toSafeJsonString(b.externalServices),
              subTotal: toSafeNumber(b.subTotal || b.amount, 0),
              taxAmount: toSafeNumber(b.taxAmount, 0),
              depositAmount: toSafeNumber(b.depositAmount, 0),
              paymentMethod: b.paymentMethod || 'online',
              paymentStatus: b.paymentStatus || 'pending'
            });
            insertedBookings++;
          }
        } catch (bookingErr) {
          console.error(`Error migrating booking for '${cName}':`, bookingErr);
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
        if (!r || !r.serviceName) continue;
        try {
          const existing = await SupportServiceRequest.findOne({
            where: {
              serviceName: String(r.serviceName).trim(),
              customerName: r.customerName || ''
            }
          });
          if (!existing) {
            await SupportServiceRequest.create({
              bookingId: extractNumericId(r.bookingId),
              customerName: r.customerName || '',
              providerName: r.providerName || '',
              serviceName: String(r.serviceName).trim(),
              price: toSafeNumber(r.price, 0),
              date: r.date || new Date().toISOString().split('T')[0],
              status: r.status || 'قيد الانتظار',
              customerId: extractNumericId(r.customerId),
              providerId: extractNumericId(r.providerId),
              serviceId: extractNumericId(r.serviceId)
            });
            insertedReqs++;
          }
        } catch (reqErr) {
          console.error(`Error migrating support request '${r.serviceName}':`, reqErr);
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
        if (!t || !t.title) continue;
        try {
          const existing = await Ticket.findOne({ where: { title: String(t.title).trim() } });
          if (!existing) {
            // Validate ENUMs
            const validStatuses = ['مفتوحة', 'قيد المعالجة', 'بانتظار العميل', 'مغلقة', 'مخالفة الأولوية'];
            const mappedStatus = validStatuses.includes(t.status) ? t.status : 'مفتوحة';

            const validPriorities = ['عالية جدا', 'عالية', 'متوسطة', 'منخفضة'];
            const mappedPriority = validPriorities.includes(t.priority) ? t.priority : 'متوسطة';

            const customerId = extractNumericId(t.customerId) || 1;
            const assignedAgentId = extractNumericId(t.assignedAgentId);
            const slaDeadline = toSafeDate(t.slaDeadline, new Date(Date.now() + 86400000));

            const ticketData: any = {
              title: String(t.title).trim(),
              description: t.description || t.title || 'طلب مساعدة ودعم فني',
              status: mappedStatus,
              priority: mappedPriority,
              department: t.department || 'عام',
              customerId,
              assignedAgentId,
              slaDeadline
            };

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
      try {
        const existingRegionsConfig = await PlatformConfig.findOne({ where: { key: 'SYSTEM_REGIONS' } });
        if (existingRegionsConfig) {
          await existingRegionsConfig.update({ value: JSON.stringify(clientRegions) });
        } else {
          await PlatformConfig.create({
            key: 'SYSTEM_REGIONS',
            value: JSON.stringify(clientRegions)
          });
        }

        const regionNames = clientRegions.map((r: any) => r?.name).filter(Boolean);
        const allCities = clientRegions.flatMap((r: any) => r?.cities || []).filter(Boolean);
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
      } catch (regionsErr) {
        console.error("Error migrating regions to PlatformConfig:", regionsErr);
      }
    }

    return { success: true, logs };
  }
}
