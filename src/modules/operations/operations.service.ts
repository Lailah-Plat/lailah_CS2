import { Op } from "sequelize";
import { OperationalCase, OperationalCaseActivity, PriorityReason, initOperationsDatabase } from "../../models/OperationModels.js";
import { Booking, Hall, Service, SupportServiceRequest } from "../../models/BookingModels.js";
import { User } from "../../models/UserModels.js";
import { Ticket } from "../../models/SupportModels.js";
import { Settlement, Invoice } from "../../models/Database.js";

// Generate standardized sequential case IDs: OPS-26-XXXXXXXXXX
export async function generateOperationalCaseId(): Promise<string> {
  const yearSuffix = '26'; // current 2026 calendar year per platform rules
  const prefix = `OPS-${yearSuffix}-`;
  
  try {
    const latest = await OperationalCase.findOne({
      where: {
        caseId: {
          [Op.like]: `${prefix}%`
        }
      },
      order: [['id', 'DESC']]
    });

    let counter = 1;
    if (latest && latest.caseId) {
      const currentNum = parseInt(latest.caseId.replace(prefix, ''), 10) || 0;
      counter = currentNum + 1;
    }

    let nextCaseId = `${prefix}${counter.toString().padStart(10, '0')}`;
    let existing = await OperationalCase.findOne({ where: { caseId: nextCaseId } });
    while (existing) {
      counter++;
      nextCaseId = `${prefix}${counter.toString().padStart(10, '0')}`;
      existing = await OperationalCase.findOne({ where: { caseId: nextCaseId } });
    }

    return nextCaseId;
  } catch (err) {
    const randomSeq = Math.floor(Math.random() * 9000000000 + 1000000000);
    return `${prefix}${randomSeq}`;
  }
}

// Teams metadata
export const OPERATIONAL_TEAMS = [
  { id: 'SUPPORT', name: 'فريق الدعم وخدمة العملاء', lead: 'عبدالله السبيعي' },
  { id: 'VERIFICATION', name: 'فريق التدقيق والاعتمادات', lead: 'سارة المنصور' },
  { id: 'FINANCE', name: 'فريق الرقابة المالية والنزاعات', lead: 'خالد الرويلي' },
  { id: 'LOGISTICS', name: 'فريق العمليات الميدانية واللوجستية', lead: 'فهد العتيبي' },
  { id: 'EXECUTIVE', name: 'فريق الرقابة السيادية والإشرافية', lead: 'الإدارة العليا' }
];

// Calculate explainable priority
export function calculateCasePriority(data: {
  caseType: string;
  eventDate?: string | null;
  financialImpact?: number;
  customerImpact?: string;
  isOverdue?: boolean;
  hasDispute?: boolean;
}): { priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'; reasons: PriorityReason[] } {
  const reasons: PriorityReason[] = [];
  let score = 0;

  // 1. Proximity of Event Date
  if (data.eventDate) {
    try {
      const eventTime = new Date(data.eventDate).getTime();
      const now = Date.now();
      const hoursUntilEvent = (eventTime - now) / (1000 * 60 * 60);

      if (hoursUntilEvent <= 24 && hoursUntilEvent >= -12) {
        score += 50;
        reasons.push({
          code: 'EVENT_URGENT_24H',
          label: `موعد المناسبة قريب جداً (خلال أقل من 24 ساعة)`,
          weight: 50
        });
      } else if (hoursUntilEvent <= 72 && hoursUntilEvent > 24) {
        score += 30;
        reasons.push({
          code: 'EVENT_APPROACHING_72H',
          label: `المناسبة مجدولة خلال 3 أيام قادمة`,
          weight: 30
        });
      }
    } catch {}
  }

  // 2. Financial Impact
  const amount = Number(data.financialImpact) || 0;
  if (amount >= 50000) {
    score += 40;
    reasons.push({
      code: 'HIGH_FINANCIAL_VALUE',
      label: `قيمة مالية عالية تزيد عن 50,000 ر.س (${amount.toLocaleString('ar-SA')} ر.س)`,
      weight: 40
    });
  } else if (amount >= 15000) {
    score += 20;
    reasons.push({
      code: 'MEDIUM_FINANCIAL_VALUE',
      label: `قيمة مالية معتبرة (${amount.toLocaleString('ar-SA')} ر.س)`,
      weight: 20
    });
  }

  // 3. Dispute or Provider cancellation of confirmed booking
  if (data.caseType === 'PROVIDER_CANCELLATION_REQUEST' || data.caseType === 'FINANCIAL_DISPUTE' || data.hasDispute) {
    score += 45;
    reasons.push({
      code: 'DISPUTE_OR_CANCELLATION',
      label: 'نزاع نشط أو طلب إلغاء من المزود لحجز مؤكد/مدفوع',
      weight: 45
    });
  }

  // 4. Overdue SLA
  if (data.isOverdue) {
    score += 35;
    reasons.push({
      code: 'SLA_BREACHED',
      label: 'تجاوزت الحالة مهلة الاستجابة المحددة نظامياً',
      weight: 35
    });
  }

  // 5. Customer Impact
  if (data.customerImpact === 'BLOCKING') {
    score += 35;
    reasons.push({
      code: 'CUSTOMER_BLOCKED',
      label: 'المشكلة تعطل إتمام العملية لدى العميل بصورة حرجة',
      weight: 35
    });
  } else if (data.customerImpact === 'HIGH') {
    score += 20;
    reasons.push({
      code: 'CUSTOMER_HIGH_IMPACT',
      label: 'تأثير تشغيلي مرتفع على تجربة العميل',
      weight: 20
    });
  }

  // 6. Case Type Specific Baseline
  if (data.caseType === 'PAYMENT_FAILED' || data.caseType === 'FINANCIAL_MISMATCH') {
    score += 25;
    reasons.push({
      code: 'PAYMENT_ANOMALY',
      label: 'تعثر أو عدم تطابق في بوابة السداد الإلكتروني',
      weight: 25
    });
  } else if (data.caseType.includes('APPROVAL')) {
    score += 15;
    reasons.push({
      code: 'COMPLIANCE_REVIEW',
      label: 'مراجعة اعتماد أمني وتراخيص نظامية',
      weight: 15
    });
  }

  let priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  if (score >= 60) priority = 'CRITICAL';
  else if (score >= 40) priority = 'HIGH';
  else if (score >= 20) priority = 'MEDIUM';

  if (reasons.length === 0) {
    reasons.push({
      code: 'STANDARD_TRIAGE',
      label: 'حالة اعتيادية تتبع المسار التشغيلي القياسي',
      weight: 10
    });
  }

  return { priority, reasons };
}

// Calculate SLA Due Dates
export function calculateSlaDueAt(priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'): Date {
  const now = new Date();
  let hours = 24;
  switch (priority) {
    case 'CRITICAL':
      hours = 2;
      break;
    case 'HIGH':
      hours = 6;
      break;
    case 'MEDIUM':
      hours = 18;
      break;
    case 'LOW':
      hours = 48;
      break;
  }
  return new Date(now.getTime() + hours * 60 * 60 * 1000);
}

// Concurrency lock for discovery engine to prevent race conditions
let discoveryRunningPromise: Promise<{ scanned: number; created: number; updated: number }> | null = null;

// Automatic Exception Discovery Engine
// Scans database records and creates/updates operational cases idempotently
export async function runExceptionDiscovery(): Promise<{ scanned: number; created: number; updated: number }> {
  if (discoveryRunningPromise) {
    return discoveryRunningPromise;
  }

  discoveryRunningPromise = (async () => {
    let created = 0;
    let updated = 0;
    let scanned = 0;

    try {
      // 1. Pending Approvals: Halls
      const pendingHalls = await Hall.findAll({
        where: {
          [Op.or]: [
            { status: 'معلق' },
            { status: 'pending' },
            { status: 'بانتظار الاعتماد' }
          ]
        },
        limit: 20
      });
      scanned += pendingHalls.length;

      for (const hall of pendingHalls) {
        try {
          const dedupKey = `HALL_APPROVAL:Hall:${hall.id}:PENDING_APPROVAL`;
          const existing = await OperationalCase.findOne({ where: { deduplicationKey: dedupKey } });

          if (!existing) {
            const caseId = await generateOperationalCaseId();
            const rawPrice = (hall as any).price;
            const priceNum = Math.round(Number(rawPrice)) || 0;
            const { priority, reasons } = calculateCasePriority({
              caseType: 'HALL_APPROVAL',
              financialImpact: priceNum,
              customerImpact: 'MEDIUM'
            });

            const hallName = (hall as any).name || 'بدون اسم';
            await OperationalCase.create({
              caseId,
              caseType: 'HALL_APPROVAL',
              title: `طلب اعتماد قاعة جديدة: ${hallName}`.substring(0, 250),
              description: `قامت المنشأة بإضافة قاعة جديدة بعنوان "${hallName}" وتتطلب مراجعة التراخيص والصور والامتثال لمعايير المنصة قبل الإطلاق العام.`.substring(0, 4000),
              source: 'SYSTEM_EVENT',
              sourceEntityType: 'Hall',
              sourceEntityId: String(hall.id),
              priority,
              priorityReasons: reasons,
              status: 'NEW',
              assignedTeamId: 'VERIFICATION',
              assignedTeamName: 'فريق التدقيق والاعتمادات',
              dueAt: calculateSlaDueAt(priority),
              financialImpact: priceNum,
              customerImpact: 'MEDIUM',
              deduplicationKey: dedupKey.substring(0, 190),
              metadata: {
                hallName,
                providerName: (hall as any).provider || (hall as any).providerName || 'غير محدد',
                city: (hall as any).city || (hall as any).location || 'غير محدد',
                capacity: (hall as any).capacity || 0
              }
            });

            await OperationalCaseActivity.create({
              caseId,
              activityType: 'CREATED',
              authorName: 'محرك اكتشاف الاستثناءات',
              authorRole: 'SYSTEM',
              message: `تم اكتشاف استثناء اعتماد لقاعة جديدة #${hall.id} وإدراج الحالة في صندوق الاعتمادات.`,
              metadata: {}
            });
            created++;
          } else if (existing.status !== 'RESOLVED' && existing.status !== 'CLOSED') {
            updated++;
          }
        } catch (itemErr: any) {
          const details = itemErr.errors ? itemErr.errors.map((e: any) => `${e.path}: ${e.message}`).join("; ") : "";
          console.error(`⚠️ Error discovering Hall #${hall.id}:`, itemErr.message, details ? `| Details: ${details}` : "");
        }
      }

      // 2. Pending Approvals: Services
      const pendingServices = await Service.findAll({
        where: {
          [Op.or]: [
            { status: 'معلق' },
            { status: 'pending' },
            { status: 'بانتظار الاعتماد' }
          ]
        },
        limit: 20
      });
      scanned += pendingServices.length;

      for (const srv of pendingServices) {
        try {
          const dedupKey = `SERVICE_APPROVAL:Service:${srv.id}:PENDING_APPROVAL`;
          const existing = await OperationalCase.findOne({ where: { deduplicationKey: dedupKey } });

          if (!existing) {
            const caseId = await generateOperationalCaseId();
            const rawPrice = (srv as any).price;
            const priceNum = Math.round(Number(rawPrice)) || 0;
            const { priority, reasons } = calculateCasePriority({
              caseType: 'SERVICE_APPROVAL',
              financialImpact: priceNum,
              customerImpact: 'LOW'
            });

            const srvName = (srv as any).name || 'خدمة غير محددة';
            await OperationalCase.create({
              caseId,
              caseType: 'SERVICE_APPROVAL',
              title: `طلب اعتماد خدمة مساندة: ${srvName}`.substring(0, 250),
              description: `تم إدراج خدمة مساندة مستقلة "${srvName}" من فئة ${(srv as any).category || 'خدمات عامة'} بانتظار الاعتماد الإداري.`.substring(0, 4000),
              source: 'SYSTEM_EVENT',
              sourceEntityType: 'Service',
              sourceEntityId: String(srv.id),
              priority,
              priorityReasons: reasons,
              status: 'NEW',
              assignedTeamId: 'VERIFICATION',
              assignedTeamName: 'فريق التدقيق والاعتمادات',
              dueAt: calculateSlaDueAt(priority),
              financialImpact: priceNum,
              customerImpact: 'LOW',
              deduplicationKey: dedupKey.substring(0, 190),
              metadata: {
                serviceName: srvName,
                category: (srv as any).category || 'عام',
                providerName: (srv as any).provider || (srv as any).providerName || 'غير محدد'
              }
            });

            await OperationalCaseActivity.create({
              caseId,
              activityType: 'CREATED',
              authorName: 'محرك اكتشاف الاستثناءات',
              authorRole: 'SYSTEM',
              message: `تم إنشاء حالة اعتماد لخدمة جديدة #${srv.id}.`,
              metadata: {}
            });
            created++;
          }
        } catch (itemErr: any) {
          const details = itemErr.errors ? itemErr.errors.map((e: any) => `${e.path}: ${e.message}`).join("; ") : "";
          console.error(`⚠️ Error discovering Service #${srv.id}:`, itemErr.message, details ? `| Details: ${details}` : "");
        }
      }

      // 3. Bookings with Attention: Stalled or pending decision or close to event
      const attentionBookings = await Booking.findAll({
        where: {
          [Op.or]: [
            { status: 'pending' },
            { status: 'قيد الانتظار' },
            { status: 'disputed' },
            { status: 'نزاع' },
            { status: 'cancellation_requested' }
          ]
        },
        limit: 30
      });
      scanned += attentionBookings.length;

      for (const bkg of attentionBookings) {
        try {
          const bkgData = bkg as any;
          let caseType: any = 'BOOKING_ATTENTION';
          if (bkgData.status === 'disputed' || bkgData.status === 'نزاع') {
            caseType = 'FINANCIAL_DISPUTE';
          } else if (bkgData.status === 'cancellation_requested') {
            caseType = 'PROVIDER_CANCELLATION_REQUEST';
          }

          const dedupKey = `${caseType}:Booking:${bkg.id}:${bkgData.status}`;
          const existing = await OperationalCase.findOne({ where: { deduplicationKey: dedupKey } });

          if (!existing) {
            const caseId = await generateOperationalCaseId();
            const rawEventDate = bkgData.startDate || bkgData.date;
            const eventDateStr = rawEventDate ? String(rawEventDate).substring(0, 32) : null;
            const rawAmount = bkgData.totalAmount || bkgData.price;
            const amountNum = Math.round(Number(rawAmount)) || 0;

            const { priority, reasons } = calculateCasePriority({
              caseType,
              eventDate: eventDateStr,
              financialImpact: amountNum,
              customerImpact: caseType === 'FINANCIAL_DISPUTE' ? 'BLOCKING' : 'HIGH',
              hasDispute: caseType === 'FINANCIAL_DISPUTE'
            });

            await OperationalCase.create({
              caseId,
              caseType,
              title: `حجز يحتاج متابعة وتدخل: #${bkg.id} (${bkgData.customerName || 'عميل'})`.substring(0, 250),
              description: `حجز رقم #${bkg.id} بحالة "${bkgData.status}" يتطلب تدخلاً ومتابعة تشغيلية لمنع تعطل الفعالية أو تفاقم النزاع.`.substring(0, 4000),
              source: 'WORKFLOW_RULE',
              sourceEntityType: 'Booking',
              sourceEntityId: String(bkg.id),
              priority,
              priorityReasons: reasons,
              status: 'NEW',
              assignedTeamId: caseType === 'FINANCIAL_DISPUTE' ? 'FINANCE' : 'SUPPORT',
              assignedTeamName: caseType === 'FINANCIAL_DISPUTE' ? 'فريق الرقابة المالية والنزاعات' : 'فريق الدعم وخدمة العملاء',
              dueAt: calculateSlaDueAt(priority),
              financialImpact: amountNum,
              customerImpact: caseType === 'FINANCIAL_DISPUTE' ? 'BLOCKING' : 'HIGH',
              eventDate: eventDateStr,
              deduplicationKey: dedupKey.substring(0, 190),
              metadata: {
                bookingId: bkg.id,
                customerName: bkgData.customerName || 'غير محدد',
                customerPhone: bkgData.phone || bkgData.customerPhone || '',
                hallName: bkgData.hallName || bkgData.hall?.name || '',
                providerName: bkgData.providerName || bkgData.hall?.provider || '',
                totalAmount: amountNum,
                period: bkgData.period || ''
              }
            });

            await OperationalCaseActivity.create({
              caseId,
              activityType: 'CREATED',
              authorName: 'محرك اكتشاف الاستثناءات',
              authorRole: 'SYSTEM',
              message: `تم اكتشاف استثناء حجز برقم #${bkg.id} وحالته (${bkgData.status}).`,
              metadata: {}
            });
            created++;
          }
        } catch (itemErr: any) {
          const details = itemErr.errors ? itemErr.errors.map((e: any) => `${e.path}: ${e.message}`).join("; ") : "";
          console.error(`⚠️ Error discovering Booking #${bkg.id}:`, itemErr.message, details ? `| Details: ${details}` : "");
        }
      }

      // 4. Stalled Support Service Requests
      const supportRequests = await SupportServiceRequest.findAll({
        where: {
          [Op.or]: [
            { status: 'قيد الانتظار' },
            { status: 'pending' },
            { status: 'متعثر' }
          ]
        },
        limit: 20
      });
      scanned += supportRequests.length;

      for (const sr of supportRequests) {
        try {
          const srData = sr as any;
          const dedupKey = `SERVICE_REQUEST_STALLED:SupportServiceRequest:${sr.id}:STALLED`;
          const existing = await OperationalCase.findOne({ where: { deduplicationKey: dedupKey } });

          if (!existing) {
            const caseId = await generateOperationalCaseId();
            const rawPrice = srData.price;
            const priceNum = Math.round(Number(rawPrice)) || 0;
            const { priority, reasons } = calculateCasePriority({
              caseType: 'SERVICE_REQUEST_STALLED',
              financialImpact: priceNum,
              customerImpact: 'HIGH'
            });

            const serviceLabel = srData.serviceName || srData.serviceType || '#' + sr.id;
            await OperationalCase.create({
              caseId,
              caseType: 'SERVICE_REQUEST_STALLED',
              title: `طلب خدمة مساندة معلق: ${serviceLabel}`.substring(0, 250),
              description: `طلب خدمة مساندة #${sr.id} لصالح العميل (${srData.customerName || 'عميل'}) قيد الانتظار ويتطلب توجيه الموفر أو متابعة التنفيذ.`.substring(0, 4000),
              source: 'WORKFLOW_RULE',
              sourceEntityType: 'SupportServiceRequest',
              sourceEntityId: String(sr.id),
              priority,
              priorityReasons: reasons,
              status: 'NEW',
              assignedTeamId: 'LOGISTICS',
              assignedTeamName: 'فريق العمليات الميدانية واللوجستية',
              dueAt: calculateSlaDueAt(priority),
              financialImpact: priceNum,
              customerImpact: 'HIGH',
              deduplicationKey: dedupKey.substring(0, 190),
              metadata: {
                requestId: sr.id,
                customerName: srData.customerName || 'غير محدد',
                serviceName: serviceLabel,
                providerName: srData.providerName || 'غير محدد',
                price: priceNum
              }
            });

            await OperationalCaseActivity.create({
              caseId,
              activityType: 'CREATED',
              authorName: 'محرك اكتشاف الاستثناءات',
              authorRole: 'SYSTEM',
              message: `تم إنشاء حالة لطلب الخدمة المساندة المعلق #${sr.id}.`,
              metadata: {}
            });
            created++;
          }
        } catch (itemErr: any) {
          const details = itemErr.errors ? itemErr.errors.map((e: any) => `${e.path}: ${e.message}`).join("; ") : "";
          console.error(`⚠️ Error discovering SupportServiceRequest #${sr.id}:`, itemErr.message, details ? `| Details: ${details}` : "");
        }
      }

      // 5. Unresolved High Priority Tickets / Complaints
      const openTickets = await Ticket.findAll({
        where: {
          status: {
            [Op.in]: ['مفتوحة', 'قيد المعالجة', 'مخالفة الأولوية']
          },
          priority: {
            [Op.in]: ['عالية جدا', 'عالية']
          }
        },
        limit: 15
      });
      scanned += openTickets.length;

      for (const tkt of openTickets) {
        try {
          const tktData = tkt as any;
          const dedupKey = `OPERATIONAL_COMPLAINT:Ticket:${tkt.id}:UNRESOLVED`;
          const existing = await OperationalCase.findOne({ where: { deduplicationKey: dedupKey } });

          if (!existing) {
            const caseId = await generateOperationalCaseId();
            const isVeryHigh = tktData.priority === 'عالية جدا';
            const { priority, reasons } = calculateCasePriority({
              caseType: 'OPERATIONAL_COMPLAINT',
              financialImpact: 5000,
              customerImpact: isVeryHigh ? 'BLOCKING' : 'HIGH'
            });

            const rawDue = tktData.slaDeadline ? new Date(tktData.slaDeadline) : null;
            const validDueAt = (rawDue && !isNaN(rawDue.getTime())) ? rawDue : calculateSlaDueAt(priority);

            await OperationalCase.create({
              caseId,
              caseType: 'OPERATIONAL_COMPLAINT',
              title: `شكوى/تذكرة حرجة: ${tktData.title || '#' + tkt.id}`.substring(0, 250),
              description: (tktData.description || `تذكرة دعم فني برقم #${tkt.id} بتصنيف أولوية مرتفع تتطلب تدخلاً سريعاً.`).substring(0, 4000),
              source: 'CUSTOMER_DISPUTE',
              sourceEntityType: 'Dispute',
              sourceEntityId: String(tkt.id),
              priority,
              priorityReasons: reasons,
              status: 'NEW',
              assignedTeamId: 'SUPPORT',
              assignedTeamName: 'فريق الدعم وخدمة العملاء',
              dueAt: validDueAt,
              financialImpact: 0,
              customerImpact: isVeryHigh ? 'BLOCKING' : 'HIGH',
              deduplicationKey: dedupKey.substring(0, 190),
              metadata: {
                ticketId: tkt.id,
                department: tktData.department || 'خدمة العملاء',
                customerId: tktData.customerId || 0
              }
            });

            await OperationalCaseActivity.create({
              caseId,
              activityType: 'CREATED',
              authorName: 'محرك اكتشاف الاستثناءات',
              authorRole: 'SYSTEM',
              message: `تم ربط تذكرة الدعم الحرجة #${tkt.id} كحالة استثناء في مركز العمليات.`,
              metadata: {}
            });
            created++;
          }
        } catch (itemErr: any) {
          const details = itemErr.errors ? itemErr.errors.map((e: any) => `${e.path}: ${e.message}`).join("; ") : "";
          console.error(`⚠️ Error discovering Ticket #${tkt.id}:`, itemErr.message, details ? `| Details: ${details}` : "");
        }
      }

    } catch (err: any) {
      const errorDetails = err.errors ? err.errors.map((e: any) => `${e.path}: ${e.message} (value: ${e.value})`).join("; ") : "";
      console.error("⚠️ Error in runExceptionDiscovery:", err.message || err, errorDetails ? `| Details: ${errorDetails}` : "");
    }

    return { scanned, created, updated };
  })().finally(() => {
    discoveryRunningPromise = null;
  });

  return discoveryRunningPromise;
}

// Operational Commands Registry
export interface CommandDefinition {
  commandId: string;
  label: string;
  description: string;
  requiredPermission: string;
  allowedCaseTypes: string[]; // empty array = all
  allowedStatuses: string[]; // empty array = all
  confirmationLevel: 'NONE' | 'CONFIRM' | 'SENSITIVE' | 'TWO_PERSON';
  reasonRequired: boolean;
  approvalRequired: boolean;
  category: 'LIFECYCLE' | 'ASSIGNMENT' | 'ESCALATION' | 'COLLABORATION' | 'VIEW';
}

export const COMMAND_REGISTRY: CommandDefinition[] = [
  {
    commandId: 'ASSIGN_TO_ME',
    label: 'إسناد الحالة إليّ',
    description: 'استلام الحالة وبدء العمل عليها تحت مسؤوليتك المباشرة',
    requiredPermission: 'operations.case.assign',
    allowedCaseTypes: [],
    allowedStatuses: ['NEW', 'TRIAGED', 'ASSIGNED', 'WAITING_EXTERNAL'],
    confirmationLevel: 'NONE',
    reasonRequired: false,
    approvalRequired: false,
    category: 'ASSIGNMENT'
  },
  {
    commandId: 'ASSIGN_TO_AGENT',
    label: 'إسناد الحالة لموظف آخر',
    description: 'توجيه الحالة لموظف محدد داخل الفريق التشغيلي',
    requiredPermission: 'operations.case.reassign',
    allowedCaseTypes: [],
    allowedStatuses: ['NEW', 'TRIAGED', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_EXTERNAL'],
    confirmationLevel: 'NONE',
    reasonRequired: true,
    approvalRequired: false,
    category: 'ASSIGNMENT'
  },
  {
    commandId: 'TRANSFER_TEAM',
    label: 'تحويل الحالة لفريق آخر',
    description: 'نقل المسؤولية التشغيلية بين الإدارات والفرق المختصة',
    requiredPermission: 'operations.case.reassign',
    allowedCaseTypes: [],
    allowedStatuses: ['NEW', 'TRIAGED', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_EXTERNAL'],
    confirmationLevel: 'CONFIRM',
    reasonRequired: true,
    approvalRequired: false,
    category: 'ASSIGNMENT'
  },
  {
    commandId: 'START_PROCESSING',
    label: 'بدء المعالجة والتحقيق',
    description: 'تحويل الحالة إلى قيد المعالجة وتسجيل بداية التعامل الفعلي',
    requiredPermission: 'operations.case.start',
    allowedCaseTypes: [],
    allowedStatuses: ['NEW', 'TRIAGED', 'ASSIGNED', 'WAITING_EXTERNAL'],
    confirmationLevel: 'NONE',
    reasonRequired: false,
    approvalRequired: false,
    category: 'LIFECYCLE'
  },
  {
    commandId: 'PAUSE_SLA_WAITING',
    label: 'تعليق المهلة (انتظار جهة خارجية)',
    description: 'إيقاف احتساب مهلة SLA مؤقتاً لسبب مشروع بانتظار رد خارجي',
    requiredPermission: 'operations.case.escalate',
    allowedCaseTypes: [],
    allowedStatuses: ['IN_PROGRESS', 'ASSIGNED'],
    confirmationLevel: 'CONFIRM',
    reasonRequired: true,
    approvalRequired: false,
    category: 'LIFECYCLE'
  },
  {
    commandId: 'RESUME_SLA',
    label: 'استئناف المعالجة واحتساب المهلة',
    description: 'إلغاء تعليق المهلة بعد ورود الرد من الجهة المعنية',
    requiredPermission: 'operations.case.start',
    allowedCaseTypes: [],
    allowedStatuses: ['WAITING_EXTERNAL'],
    confirmationLevel: 'NONE',
    reasonRequired: false,
    approvalRequired: false,
    category: 'LIFECYCLE'
  },
  {
    commandId: 'ESCALATE_CASE',
    label: 'تصعيد الحالة تشغيلياً',
    description: 'رفع مستوى التدخل إلى المشرف المباشر أو الإدارة العليا',
    requiredPermission: 'operations.case.escalate',
    allowedCaseTypes: [],
    allowedStatuses: ['NEW', 'TRIAGED', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_EXTERNAL'],
    confirmationLevel: 'CONFIRM',
    reasonRequired: true,
    approvalRequired: false,
    category: 'ESCALATION'
  },
  {
    commandId: 'DE_ESCALATE_CASE',
    label: 'تخفيض التصعيد',
    description: 'إعادة الحالة للمستوى التشغيلي الاعتيادي بعد زوال سبب التصعيد',
    requiredPermission: 'operations.case.escalate',
    allowedCaseTypes: [],
    allowedStatuses: ['ESCALATED'],
    confirmationLevel: 'CONFIRM',
    reasonRequired: true,
    approvalRequired: false,
    category: 'ESCALATION'
  },
  {
    commandId: 'CREATE_SUBTASK',
    label: 'إنشاء مهمة فرعية',
    description: 'تكليف زميل أو قسم بمهمة استقصاء أو إجراء فرعي تابع للحالة',
    requiredPermission: 'operations.case.start',
    allowedCaseTypes: [],
    allowedStatuses: ['ASSIGNED', 'IN_PROGRESS', 'WAITING_EXTERNAL', 'ESCALATED'],
    confirmationLevel: 'NONE',
    reasonRequired: true,
    approvalRequired: false,
    category: 'COLLABORATION'
  },
  {
    commandId: 'REQUEST_MORE_INFO',
    label: 'طلب معلومات وإيضاحات إضافية',
    description: 'إرسال استفسار رسمي إلى العميل أو المزود عبر القنوات المعتمدة',
    requiredPermission: 'operations.case.start',
    allowedCaseTypes: [],
    allowedStatuses: ['IN_PROGRESS', 'ASSIGNED'],
    confirmationLevel: 'NONE',
    reasonRequired: true,
    approvalRequired: false,
    category: 'COLLABORATION'
  },
  {
    commandId: 'ADD_INTERNAL_NOTE',
    label: 'إضافة ملاحظة داخلية سرية',
    description: 'تدوين ملحوظة لفريق العمليات تظهر فقط للموظفين والمشرفين',
    requiredPermission: 'operations.case.view',
    allowedCaseTypes: [],
    allowedStatuses: [],
    confirmationLevel: 'NONE',
    reasonRequired: false,
    approvalRequired: false,
    category: 'COLLABORATION'
  },
  {
    commandId: 'RESOLVE_CASE',
    label: 'اعتماد الحل وإغلاق المعالجة',
    description: 'توثيق نتيجة الحل وتحويل الحالة إلى محلولة رسمياً',
    requiredPermission: 'operations.case.resolve',
    allowedCaseTypes: [],
    allowedStatuses: ['IN_PROGRESS', 'WAITING_EXTERNAL', 'ESCALATED', 'ASSIGNED'],
    confirmationLevel: 'CONFIRM',
    reasonRequired: true,
    approvalRequired: false,
    category: 'LIFECYCLE'
  },
  {
    commandId: 'CLOSE_CASE',
    label: 'إغلاق الحالة نهائياً',
    description: 'الأرشفة والإغلاق التام للحالة بعد تأكيد استقرار المعالجة',
    requiredPermission: 'operations.case.close',
    allowedCaseTypes: [],
    allowedStatuses: ['RESOLVED'],
    confirmationLevel: 'CONFIRM',
    reasonRequired: false,
    approvalRequired: false,
    category: 'LIFECYCLE'
  },
  {
    commandId: 'REOPEN_CASE',
    label: 'إعادة فتح الحالة المغلقة',
    description: 'استئناف التعامل مع الحالة عند استجداد معطيات جديدة',
    requiredPermission: 'operations.case.reopen',
    allowedCaseTypes: [],
    allowedStatuses: ['RESOLVED', 'CLOSED'],
    confirmationLevel: 'SENSITIVE',
    reasonRequired: true,
    approvalRequired: false,
    category: 'LIFECYCLE'
  },
  {
    commandId: 'VIEW_IN_DASHBOARD',
    label: 'فتح السجل الكامل في لوحة الإدارة',
    description: 'الانتقال إلى السجل الأصلي في لوحة الإدارة الشاملة لمن يملك الصلاحية',
    requiredPermission: 'operations.case.view',
    allowedCaseTypes: [],
    allowedStatuses: [],
    confirmationLevel: 'NONE',
    reasonRequired: false,
    approvalRequired: false,
    category: 'VIEW'
  }
];

// Execute Command with server-side validations, state machine guards, and audit trail
export async function executeOperationalCommand(args: {
  commandId: string;
  caseId: string;
  user: { id?: number; name?: string; role?: string; email?: string };
  payload?: any;
}): Promise<{ success: boolean; message: string; updatedCase?: any; data?: any }> {
  const { commandId, caseId, user, payload = {} } = args;

  // Handle global/system level commands without a specific caseId
  if (commandId === 'TRIGGER_EXCEPTION_DISCOVERY') {
    const discoveryResult = await runExceptionDiscovery();
    return {
      success: true,
      message: `تم تشغيل فحص الاستثناءات بنجاح. تم فحص ${discoveryResult.scanned} وتحديث/إنشاء الحالات المطلوبة.`,
      data: discoveryResult
    };
  }

  const targetCase = await OperationalCase.findOne({ where: { caseId } });
  if (!targetCase) {
    return { success: false, message: `لم يتم العثور على الحالة التشغيلية رقم ${caseId}` };
  }

  const commandDef = COMMAND_REGISTRY.find(c => c.commandId === commandId);
  if (!commandDef) {
    return { success: false, message: `الأمر التشغيلي "${commandId}" غير مسجل في النظام.` };
  }

  // Check allowed statuses
  if (commandDef.allowedStatuses.length > 0 && !commandDef.allowedStatuses.includes(targetCase.status)) {
    return {
      success: false,
      message: `لا يمكن تنفيذ أمر "${commandDef.label}" لأن الحالة الحالية هي "${targetCase.status}".`
    };
  }

  // Check allowed case types
  if (commandDef.allowedCaseTypes.length > 0 && !commandDef.allowedCaseTypes.includes(targetCase.caseType)) {
    return {
      success: false,
      message: `أمر "${commandDef.label}" غير متاح لنوع الحالة "${targetCase.caseType}".`
    };
  }

  // Check reason requirement
  if (commandDef.reasonRequired && (!payload.reason || String(payload.reason).trim().length < 3)) {
    return {
      success: false,
      message: `يتطلب تنفيذ أمر "${commandDef.label}" كتابة وتوثيق سبب الإجراء.`
    };
  }

  const authorName = user.name || user.email || 'مشرف العمليات';
  const authorRole = user.role || 'OPERATIONS_STAFF';
  let previousStatus = targetCase.status;
  let newStatus = targetCase.status;
  let activityType: any = 'STATUS_CHANGE';
  let logMessage = '';

  switch (commandId) {
    case 'ASSIGN_TO_ME': {
      targetCase.assignedUserId = user.id || 1;
      targetCase.assignedUserName = authorName;
      if (targetCase.status === 'NEW') targetCase.status = 'ASSIGNED';
      newStatus = targetCase.status;
      activityType = 'ASSIGNMENT';
      logMessage = `قام الموظف (${authorName}) باستلام الحالة وإسنادها لذاته.`;
      break;
    }

    case 'ASSIGN_TO_AGENT': {
      targetCase.assignedUserId = payload.assignedUserId || null;
      targetCase.assignedUserName = payload.assignedUserName || 'موظف محدد';
      if (targetCase.status === 'NEW') targetCase.status = 'ASSIGNED';
      newStatus = targetCase.status;
      activityType = 'ASSIGNMENT';
      logMessage = `تمت إعادة إسناد الحالة إلى (${targetCase.assignedUserName})، السبب: ${payload.reason}`;
      break;
    }

    case 'TRANSFER_TEAM': {
      const targetTeam = OPERATIONAL_TEAMS.find(t => t.id === payload.targetTeamId);
      targetCase.assignedTeamId = payload.targetTeamId;
      targetCase.assignedTeamName = targetTeam ? targetTeam.name : payload.targetTeamId;
      targetCase.assignedUserId = null;
      targetCase.assignedUserName = null;
      activityType = 'ASSIGNMENT';
      logMessage = `تم تحويل الحالة إلى (${targetCase.assignedTeamName})، السبب: ${payload.reason}`;
      break;
    }

    case 'START_PROCESSING': {
      targetCase.status = 'IN_PROGRESS';
      newStatus = 'IN_PROGRESS';
      if (!targetCase.firstResponseAt) {
        targetCase.firstResponseAt = new Date();
      }
      logMessage = `بدء المعالجة والتحقيق الفعلي في مجريات الحالة.`;
      break;
    }

    case 'PAUSE_SLA_WAITING': {
      targetCase.status = 'WAITING_EXTERNAL';
      targetCase.isSlaPaused = true;
      targetCase.slaPauseReason = payload.reason;
      targetCase.slaPausedAt = new Date();
      newStatus = 'WAITING_EXTERNAL';
      activityType = 'SLA_PAUSE';
      logMessage = `تم تعليق مهلة مستوى الخدمة (SLA) بانتظار جهة خارجية. السبب: ${payload.reason}`;
      break;
    }

    case 'RESUME_SLA': {
      targetCase.status = 'IN_PROGRESS';
      targetCase.isSlaPaused = false;
      targetCase.slaPauseReason = null;
      targetCase.slaPausedAt = null;
      newStatus = 'IN_PROGRESS';
      activityType = 'SLA_RESUME';
      logMessage = `تم استئناف احتساب المهلة ومتابعة الإجراءات التشغيلية.`;
      break;
    }

    case 'ESCALATE_CASE': {
      targetCase.status = 'ESCALATED';
      targetCase.escalationLevel = (targetCase.escalationLevel || 0) + 1;
      newStatus = 'ESCALATED';
      activityType = 'ESCALATION';
      logMessage = `تم تصعيد الحالة إلى المستوى ${targetCase.escalationLevel}. السبب: ${payload.reason}`;
      break;
    }

    case 'DE_ESCALATE_CASE': {
      targetCase.status = 'IN_PROGRESS';
      targetCase.escalationLevel = Math.max(0, (targetCase.escalationLevel || 1) - 1);
      newStatus = 'IN_PROGRESS';
      activityType = 'DE_ESCALATION';
      logMessage = `تم تخفيض مستوى التصعيد إلى ${targetCase.escalationLevel} وإعادة الحالة إلى قيد المعالجة الاعتيادية. السبب: ${payload.reason}`;
      break;
    }

    case 'CREATE_SUBTASK': {
      activityType = 'SUBTASK_CREATED';
      logMessage = `تم إنشاء مهمة فرعية: "${payload.title || payload.reason}" للمسؤول (${payload.assignee || 'فريق العمليات'}).`;
      break;
    }

    case 'REQUEST_MORE_INFO': {
      activityType = 'CUSTOMER_MESSAGE';
      logMessage = `طلب إيضاحات إضافية: "${payload.reason}"`;
      break;
    }

    case 'ADD_INTERNAL_NOTE': {
      activityType = 'INTERNAL_NOTE';
      logMessage = payload.note || payload.reason || 'ملاحظة داخلية مسجلة';
      break;
    }

    case 'RESOLVE_CASE': {
      targetCase.status = 'RESOLVED';
      targetCase.resolvedAt = new Date();
      targetCase.resolutionCode = payload.resolutionCode || 'RESOLVED_SATISFACTORILY';
      targetCase.resolutionSummary = payload.reason || payload.summary || 'تم حل الحالة وتوثيق التسوية';
      newStatus = 'RESOLVED';
      activityType = 'RESOLVED';
      logMessage = `تم اعتماد حل الحالة بنجاح. ملخص الحل: ${targetCase.resolutionSummary}`;
      break;
    }

    case 'CLOSE_CASE': {
      targetCase.status = 'CLOSED';
      targetCase.closedAt = new Date();
      newStatus = 'CLOSED';
      activityType = 'CLOSED';
      logMessage = `تم إغلاق الحالة وأرشفتها نهائياً.`;
      break;
    }

    case 'REOPEN_CASE': {
      targetCase.status = 'REOPENED';
      targetCase.closedAt = null;
      targetCase.resolvedAt = null;
      newStatus = 'REOPENED';
      activityType = 'REOPENED';
      logMessage = `تمت إعادة فتح الحالة المغلقة بناءً على معطيات جديدة. السبب: ${payload.reason}`;
      break;
    }

    default:
      logMessage = `تنفيذ أمر تشغيلي: ${commandDef.label}`;
  }

  targetCase.version = (targetCase.version || 1) + 1;
  await targetCase.save();

  await OperationalCaseActivity.create({
    caseId,
    activityType,
    authorId: user.id || null,
    authorName,
    authorRole,
    previousValue: previousStatus,
    newValue: newStatus,
    message: logMessage,
    metadata: payload
  });

  return {
    success: true,
    message: `تم تنفيذ أمر "${commandDef.label}" بنجاح وتوثيق القرار في سجل التدقيق.`,
    updatedCase: targetCase.toJSON()
  };
}
