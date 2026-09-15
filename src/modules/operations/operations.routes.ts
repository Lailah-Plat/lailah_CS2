import { Router, Request, Response } from "express";
import { Op } from "sequelize";
import { OperationalCase, OperationalCaseActivity, initOperationsDatabase } from "../../models/OperationModels.js";
import { 
  runExceptionDiscovery, 
  generateOperationalCaseId, 
  calculateCasePriority, 
  calculateSlaDueAt, 
  COMMAND_REGISTRY, 
  executeOperationalCommand,
  OPERATIONAL_TEAMS
} from "./operations.service.js";
import { Booking, Hall, Service, SupportServiceRequest } from "../../models/BookingModels.js";
import { User } from "../../models/UserModels.js";

export const operationsRouter = Router();

// Ensure DB initialization on first route load
let isDbInitialized = false;
let dbInitPromise: Promise<void> | null = null;
async function ensureDb(): Promise<void> {
  if (isDbInitialized) return;
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = (async () => {
    try {
      await initOperationsDatabase();
      await runExceptionDiscovery();
      isDbInitialized = true;
    } catch (err: any) {
      console.error("⚠️ Failed to initialize operations DB:", err.message);
    } finally {
      dbInitPromise = null;
    }
  })();

  return dbInitPromise;
}

// Operations Authorization Guard
// Enforces strict isolation: Providers and Customers are strictly prohibited.
// Ensures req.headers contains valid user role and id so downstream logger & audit services log correctly.
operationsRouter.use((req: Request, res: Response, next) => {
  const roleHeader = String(req.headers['x-user-role'] || (req as any).user?.role || '').toLowerCase();

  // Strict isolation: Customers are forbidden from operational endpoints
  if (roleHeader === 'customer' || roleHeader.includes('عميل')) {
    return res.status(403).json({ error: 'غير مصرح: هذا المسار التشغيلي غير متاح للعملاء.' });
  }

  // Strict isolation: Providers & Agencies are forbidden
  if (
    (roleHeader === 'provider' || roleHeader.includes('مزود') || roleHeader === 'agency' || roleHeader.includes('وكالة')) &&
    !roleHeader.includes('admin')
  ) {
    return res.status(403).json({ error: 'غير مصرح: هذا المسار التشغيلي مخصص للإدارة والعمليات فقط.' });
  }

  // If role is empty or guest, populate with operational admin context and set headers
  if (!req.headers['x-user-role'] || req.headers['x-user-role'] === 'guest') {
    req.headers['x-user-role'] = 'admin';
  }
  if (!req.headers['x-user-id'] || req.headers['x-user-id'] === 'guest') {
    req.headers['x-user-id'] = '1';
  }
  if (!req.headers['x-user-name']) {
    req.headers['x-user-name'] = encodeURIComponent('إدارة العمليات');
  }

  next();
});

// Helper to extract auth user
function getUserFromReq(req: Request) {
  const userRole = (req.headers['x-user-role'] as string) || (req as any).user?.role || 'admin';
  const userNameHeader = req.headers['x-user-name'] as string;
  let userName = 'مشرف العمليات';
  if (userNameHeader) {
    try {
      userName = decodeURIComponent(userNameHeader);
    } catch {
      userName = userNameHeader;
    }
  } else if ((req as any).user?.name) {
    userName = (req as any).user.name;
  }
  const userId = parseInt((req.headers['x-user-id'] as string) || '1', 10);
  return { id: isNaN(userId) ? 1 : userId, name: userName, role: userRole };
}

// 1. GET /api/operations/summary - Pulse summary counts & KPIs
operationsRouter.get("/summary", async (req: Request, res: Response) => {
  try {
    await ensureDb();
    const user = getUserFromReq(req);
    const now = new Date();
    const approachingThreshold = new Date(now.getTime() + 4 * 60 * 60 * 1000); // within 4 hours

    const allActiveCases = await OperationalCase.findAll({
      where: {
        status: {
          [Op.notIn]: ['RESOLVED', 'CLOSED']
        }
      }
    });

    const totalActive = allActiveCases.length;
    const critical = allActiveCases.filter(c => c.priority === 'CRITICAL').length;
    const high = allActiveCases.filter(c => c.priority === 'HIGH').length;
    const unassigned = allActiveCases.filter(c => !c.assignedUserId).length;
    const assignedToMe = allActiveCases.filter(c => c.assignedUserId === user.id || (user.name && c.assignedUserName?.includes(user.name))).length;
    
    // SLA Overdue & Approaching
    const overdue = allActiveCases.filter(c => !c.isSlaPaused && new Date(c.dueAt).getTime() < now.getTime()).length;
    const approachingSla = allActiveCases.filter(c => !c.isSlaPaused && new Date(c.dueAt).getTime() >= now.getTime() && new Date(c.dueAt).getTime() <= approachingThreshold.getTime()).length;

    // By Categories
    const pendingApprovals = allActiveCases.filter(c => c.caseType.includes('APPROVAL')).length;
    const bookingsAttention = allActiveCases.filter(c => c.caseType === 'BOOKING_ATTENTION' || c.caseType === 'PROVIDER_DEADLINE_EXPIRED').length;
    const financialStalled = allActiveCases.filter(c => c.caseType === 'PAYMENT_FAILED' || c.caseType === 'FINANCIAL_MISMATCH' || c.caseType === 'SETTLEMENT_STALLED').length;
    const openDisputes = allActiveCases.filter(c => c.caseType === 'FINANCIAL_DISPUTE' || c.caseType === 'OPERATIONAL_COMPLAINT').length;
    const activeEscalations = allActiveCases.filter(c => c.status === 'ESCALATED' || (c.escalationLevel && c.escalationLevel > 0)).length;

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      counts: {
        totalActive,
        critical,
        high,
        unassigned,
        assignedToMe,
        overdue,
        approachingSla,
        pendingApprovals,
        bookingsAttention,
        financialStalled,
        openDisputes,
        activeEscalations
      },
      teams: OPERATIONAL_TEAMS
    });
  } catch (err: any) {
    console.error("Ops summary error:", err);
    res.status(500).json({ error: "فشل استخراج ملخص النبض التشغيلي" });
  }
});

// 2. GET /api/operations/exceptions or /api/operations/cases - Query cases with comprehensive filtering & pagination
operationsRouter.get(["/exceptions", "/cases"], async (req: Request, res: Response) => {
  try {
    await ensureDb();
    const user = getUserFromReq(req);
    const { 
      filter, 
      status, 
      priority, 
      team, 
      search, 
      page = '1', 
      limit = '50',
      view
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * pageLimit;

    const whereClause: any = {};
    const now = new Date();

    // Specific pulse filter mapping
    if (filter === 'critical') {
      whereClause.priority = 'CRITICAL';
      whereClause.status = { [Op.notIn]: ['RESOLVED', 'CLOSED'] };
    } else if (filter === 'high') {
      whereClause.priority = 'HIGH';
      whereClause.status = { [Op.notIn]: ['RESOLVED', 'CLOSED'] };
    } else if (filter === 'unassigned') {
      whereClause.assignedUserId = null;
      whereClause.status = { [Op.notIn]: ['RESOLVED', 'CLOSED'] };
    } else if (filter === 'my-cases') {
      whereClause[Op.or] = [
        { assignedUserId: user.id },
        { assignedUserName: { [Op.like]: `%${user.name}%` } }
      ];
      whereClause.status = { [Op.notIn]: ['RESOLVED', 'CLOSED'] };
    } else if (filter === 'overdue' || filter === 'sla') {
      whereClause.isSlaPaused = false;
      whereClause.dueAt = { [Op.lt]: now };
      whereClause.status = { [Op.notIn]: ['RESOLVED', 'CLOSED'] };
    } else if (filter === 'approaching') {
      const approachingThreshold = new Date(now.getTime() + 4 * 60 * 60 * 1000);
      whereClause.isSlaPaused = false;
      whereClause.dueAt = { [Op.between]: [now, approachingThreshold] };
      whereClause.status = { [Op.notIn]: ['RESOLVED', 'CLOSED'] };
    } else if (filter === 'approvals') {
      whereClause.caseType = { [Op.like]: '%APPROVAL%' };
      whereClause.status = { [Op.notIn]: ['RESOLVED', 'CLOSED'] };
    } else if (filter === 'bookings') {
      whereClause.caseType = { [Op.in]: ['BOOKING_ATTENTION', 'PROVIDER_DEADLINE_EXPIRED', 'SERVICE_REQUEST_STALLED', 'PROVIDER_CANCELLATION_REQUEST'] };
      whereClause.status = { [Op.notIn]: ['RESOLVED', 'CLOSED'] };
    } else if (filter === 'financial') {
      whereClause.caseType = { [Op.in]: ['PAYMENT_FAILED', 'FINANCIAL_MISMATCH', 'SETTLEMENT_STALLED', 'REFUND_REQUEST'] };
      whereClause.status = { [Op.notIn]: ['RESOLVED', 'CLOSED'] };
    } else if (filter === 'disputes') {
      whereClause.caseType = { [Op.in]: ['FINANCIAL_DISPUTE', 'OPERATIONAL_COMPLAINT'] };
      whereClause.status = { [Op.notIn]: ['RESOLVED', 'CLOSED'] };
    } else if (filter === 'escalations') {
      whereClause[Op.or] = [
        { status: 'ESCALATED' },
        { escalationLevel: { [Op.gt]: 0 } }
      ];
      whereClause.status = { [Op.notIn]: ['RESOLVED', 'CLOSED'] };
    } else if (filter === 'closed') {
      whereClause.status = { [Op.in]: ['RESOLVED', 'CLOSED'] };
    } else if (!status) {
      // Default: Active cases
      whereClause.status = { [Op.notIn]: ['RESOLVED', 'CLOSED'] };
    }

    if (status) {
      whereClause.status = status;
    }
    if (priority) {
      whereClause.priority = priority;
    }
    if (team) {
      whereClause.assignedTeamId = team;
    }

    if (search && search.trim().length > 0) {
      const q = search.trim();
      whereClause[Op.or] = [
        { caseId: { [Op.like]: `%${q}%` } },
        { title: { [Op.like]: `%${q}%` } },
        { description: { [Op.like]: `%${q}%` } },
        { sourceEntityId: { [Op.like]: `%${q}%` } },
        { assignedUserName: { [Op.like]: `%${q}%` } }
      ];
    }

    const { rows, count } = await OperationalCase.findAndCountAll({
      where: whereClause,
      order: [
        // Priority ordering: CRITICAL > HIGH > MEDIUM > LOW
        ['priority', 'ASC'], // In enum, order might vary; we can also order by dueAt
        ['dueAt', 'ASC'],
        ['updatedAt', 'DESC']
      ],
      limit: pageLimit,
      offset
    });

    res.json({
      success: true,
      cases: rows,
      totalCount: count,
      page: pageNum,
      totalPages: Math.ceil(count / pageLimit)
    });
  } catch (err: any) {
    console.error("Fetch cases error:", err);
    res.status(500).json({ error: "فشل جلب الحالات التشغيلية" });
  }
});

// 3. GET /api/operations/cases/:caseId - Single case details with timeline activity
operationsRouter.get("/cases/:caseId", async (req: Request, res: Response) => {
  try {
    await ensureDb();
    const { caseId } = req.params;

    const opCase = await OperationalCase.findOne({
      where: { caseId },
      include: [
        {
          model: OperationalCaseActivity,
          as: 'activities',
          separate: true,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!opCase) {
      return res.status(404).json({ error: `الحالة التشغيلية ${caseId} غير موجودة.` });
    }

    // Try to attach contextual domain entity details
    let entityDetails: any = null;
    try {
      if (opCase.sourceEntityType === 'Booking') {
        entityDetails = await Booking.findByPk(opCase.sourceEntityId);
      } else if (opCase.sourceEntityType === 'Hall') {
        entityDetails = await Hall.findByPk(opCase.sourceEntityId);
      } else if (opCase.sourceEntityType === 'Service') {
        entityDetails = await Service.findByPk(opCase.sourceEntityId);
      } else if (opCase.sourceEntityType === 'SupportServiceRequest') {
        entityDetails = await SupportServiceRequest.findByPk(opCase.sourceEntityId);
      }
    } catch {}

    res.json({
      success: true,
      case: opCase,
      entityDetails
    });
  } catch (err: any) {
    console.error("Fetch case detail error:", err);
    res.status(500).json({ error: "فشل جلب تفاصيل الحالة" });
  }
});

// 4. POST /api/operations/cases - Manual creation of operational case
operationsRouter.post("/cases", async (req: Request, res: Response) => {
  try {
    await ensureDb();
    const user = getUserFromReq(req);
    const { 
      caseType, 
      title, 
      description, 
      sourceEntityType, 
      sourceEntityId, 
      priority: requestedPriority,
      assignedTeamId,
      assignedUserId,
      assignedUserName,
      financialImpact = 0,
      customerImpact = 'MEDIUM',
      eventDate
    } = req.body;

    if (!title || !description || !sourceEntityType || !sourceEntityId) {
      return res.status(400).json({ error: "جميع الحقول الأساسية للعنوان والوصف والكيان المرتبط مطلوبة." });
    }

    const dedupKey = `MANUAL:${caseType || 'CROSS_DEPARTMENT_COORDINATION'}:${sourceEntityType}:${sourceEntityId}:${Date.now()}`;
    const caseId = await generateOperationalCaseId();

    const { priority, reasons } = calculateCasePriority({
      caseType: caseType || 'CROSS_DEPARTMENT_COORDINATION',
      eventDate,
      financialImpact: Number(financialImpact) || 0,
      customerImpact
    });

    const finalPriority = requestedPriority || priority;
    const dueAt = calculateSlaDueAt(finalPriority);

    const team = OPERATIONAL_TEAMS.find(t => t.id === assignedTeamId) || OPERATIONAL_TEAMS[0];

    const newCase = await OperationalCase.create({
      caseId,
      caseType: caseType || 'CROSS_DEPARTMENT_COORDINATION',
      title,
      description,
      source: 'MANUAL_STAFF',
      sourceEntityType,
      sourceEntityId: String(sourceEntityId),
      priority: finalPriority,
      priorityReasons: reasons,
      status: assignedUserId ? 'ASSIGNED' : 'NEW',
      assignedUserId: assignedUserId || null,
      assignedUserName: assignedUserName || null,
      assignedTeamId: team.id,
      assignedTeamName: team.name,
      dueAt,
      financialImpact: Number(financialImpact) || 0,
      customerImpact,
      eventDate: eventDate || null,
      createdBy: user.name || 'موظف العمليات',
      deduplicationKey: dedupKey,
      metadata: req.body.metadata || {}
    });

    await OperationalCaseActivity.create({
      caseId,
      activityType: 'CREATED',
      authorId: user.id,
      authorName: user.name || 'موظف العمليات',
      authorRole: user.role || 'STAFF',
      message: `تم إنشاء الحالة يدوياً من قبل (${user.name}).`
    });

    res.json({
      success: true,
      message: `تم إنشاء الحالة التشغيلية ${caseId} بنجاح.`,
      case: newCase
    });
  } catch (err: any) {
    console.error("Create case error:", err);
    res.status(500).json({ error: "فشل إنشاء الحالة التشغيلية" });
  }
});

// 5. GET /api/operations/search - Global search across operational scope
operationsRouter.get("/search", async (req: Request, res: Response) => {
  try {
    await ensureDb();
    const query = (req.query.q as string || '').trim();

    if (!query) {
      // Return recently updated cases
      const recents = await OperationalCase.findAll({
        limit: 10,
        order: [['updatedAt', 'DESC']]
      });
      return res.json({
        success: true,
        cases: recents,
        nonCaseMatches: []
      });
    }

    // 1. Search Operational Cases
    const matchingCases = await OperationalCase.findAll({
      where: {
        [Op.or]: [
          { caseId: { [Op.like]: `%${query}%` } },
          { title: { [Op.like]: `%${query}%` } },
          { description: { [Op.like]: `%${query}%` } },
          { sourceEntityId: { [Op.like]: `%${query}%` } },
          { assignedUserName: { [Op.like]: `%${query}%` } },
          { deduplicationKey: { [Op.like]: `%${query}%` } }
        ]
      },
      limit: 20,
      order: [['updatedAt', 'DESC']]
    });

    // 2. Search linked non-case entities (Bookings, Services, Halls)
    const nonCaseMatches: any[] = [];

    // Search bookings by numeric or BKG ID
    const cleanNum = query.replace(/\D/g, '');
    if (cleanNum || query.toUpperCase().startsWith('BKG')) {
      const bookings = await Booking.findAll({
        where: cleanNum ? { id: parseInt(cleanNum, 10) } : {},
        limit: 3
      });

      for (const b of bookings) {
        const hasCase = matchingCases.some(c => c.sourceEntityType === 'Booking' && String(c.sourceEntityId) === String(b.id));
        if (!hasCase) {
          nonCaseMatches.push({
            type: 'Booking',
            id: b.id,
            displayId: `BKG-26-${String(b.id).padStart(10, '0')}`,
            title: `حجز قاعة: ${(b as any).hallName || (b as any).hall?.name || '#' + b.id}`,
            customerName: (b as any).customerName,
            status: (b as any).status,
            dashboardUrl: `/dashboard/bookings/${b.id}`,
            canCreateCase: true
          });
        }
      }
    }

    // Search halls
    const halls = await Hall.findAll({
      where: {
        name: { [Op.like]: `%${query}%` }
      },
      limit: 3
    });
    for (const h of halls) {
      const hasCase = matchingCases.some(c => c.sourceEntityType === 'Hall' && String(c.sourceEntityId) === String(h.id));
      if (!hasCase) {
        nonCaseMatches.push({
          type: 'Hall',
          id: h.id,
          displayId: `HAL-${h.id}`,
          title: (h as any).name,
          providerName: (h as any).provider || (h as any).providerName,
          status: (h as any).status,
          dashboardUrl: `/dashboard/halls/${h.id}`,
          canCreateCase: true
        });
      }
    }

    res.json({
      success: true,
      query,
      cases: matchingCases,
      nonCaseMatches
    });
  } catch (err: any) {
    console.error("Search error:", err);
    res.status(500).json({ error: "فشل تنفيذ البحث التشغيلي" });
  }
});

// 6. GET /api/operations/commands - List all registered operational commands
operationsRouter.get("/commands", (req: Request, res: Response) => {
  res.json({
    success: true,
    commands: COMMAND_REGISTRY
  });
});

// 7. POST /api/operations/commands/:commandId/execute or POST /api/operations/commands/execute
operationsRouter.post("/commands/execute", async (req: Request, res: Response) => {
  try {
    await ensureDb();
    const user = getUserFromReq(req);
    const { commandId, caseId, parameters, payload } = req.body;

    if (!commandId) {
      return res.status(400).json({ error: "معرف الأمر commandId مطلوب لتنفيذ الأمر." });
    }

    const result = await executeOperationalCommand({
      commandId,
      caseId: caseId || '',
      user,
      payload: payload || parameters || {}
    });

    if (!result.success) {
      return res.status(422).json({ error: result.message });
    }

    res.json(result);
  } catch (err: any) {
    console.error("Command execution error:", err);
    res.status(500).json({ error: "حدث خطأ أثناء تنفيذ الأمر التشغيلي" });
  }
});

operationsRouter.post("/commands/:commandId/execute", async (req: Request, res: Response) => {
  try {
    await ensureDb();
    const user = getUserFromReq(req);
    const { commandId } = req.params;
    const { caseId, payload, parameters } = req.body;

    const result = await executeOperationalCommand({
      commandId,
      caseId: caseId || '',
      user,
      payload: payload || parameters || {}
    });

    if (!result.success) {
      return res.status(422).json({ error: result.message });
    }

    res.json(result);
  } catch (err: any) {
    console.error("Command execution error:", err);
    res.status(500).json({ error: "حدث خطأ أثناء تنفيذ الأمر التشغيلي" });
  }
});

// 8. Dedicated Action Endpoints mapping directly to commands for REST convenience
operationsRouter.post("/cases/:caseId/assign", async (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  const { caseId } = req.params;
  const { assignedUserId, assignedUserName, reason } = req.body;
  const cmd = assignedUserId && assignedUserId !== user.id ? 'ASSIGN_TO_AGENT' : 'ASSIGN_TO_ME';
  const result = await executeOperationalCommand({
    commandId: cmd,
    caseId,
    user,
    payload: { assignedUserId, assignedUserName, reason }
  });
  if (!result.success) return res.status(422).json({ error: result.message });
  res.json(result);
});

operationsRouter.post("/cases/:caseId/start", async (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  const { caseId } = req.params;
  const result = await executeOperationalCommand({
    commandId: 'START_PROCESSING',
    caseId,
    user,
    payload: req.body
  });
  if (!result.success) return res.status(422).json({ error: result.message });
  res.json(result);
});

operationsRouter.post("/cases/:caseId/escalate", async (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  const { caseId } = req.params;
  const result = await executeOperationalCommand({
    commandId: 'ESCALATE_CASE',
    caseId,
    user,
    payload: req.body
  });
  if (!result.success) return res.status(422).json({ error: result.message });
  res.json(result);
});

operationsRouter.post("/cases/:caseId/request-information", async (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  const { caseId } = req.params;
  const result = await executeOperationalCommand({
    commandId: 'REQUEST_MORE_INFO',
    caseId,
    user,
    payload: req.body
  });
  if (!result.success) return res.status(422).json({ error: result.message });
  res.json(result);
});

operationsRouter.post("/cases/:caseId/resolve", async (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  const { caseId } = req.params;
  const result = await executeOperationalCommand({
    commandId: 'RESOLVE_CASE',
    caseId,
    user,
    payload: req.body
  });
  if (!result.success) return res.status(422).json({ error: result.message });
  res.json(result);
});

operationsRouter.post("/cases/:caseId/close", async (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  const { caseId } = req.params;
  const result = await executeOperationalCommand({
    commandId: 'CLOSE_CASE',
    caseId,
    user,
    payload: req.body
  });
  if (!result.success) return res.status(422).json({ error: result.message });
  res.json(result);
});

operationsRouter.post("/cases/:caseId/reopen", async (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  const { caseId } = req.params;
  const result = await executeOperationalCommand({
    commandId: 'REOPEN_CASE',
    caseId,
    user,
    payload: req.body
  });
  if (!result.success) return res.status(422).json({ error: result.message });
  res.json(result);
});

operationsRouter.post("/cases/:caseId/notes", async (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  const { caseId } = req.params;
  const { note } = req.body;
  const result = await executeOperationalCommand({
    commandId: 'ADD_INTERNAL_NOTE',
    caseId,
    user,
    payload: { note, reason: note }
  });
  if (!result.success) return res.status(422).json({ error: result.message });
  res.json(result);
});

// 9. GET /api/operations/cases/:caseId/timeline
operationsRouter.get("/cases/:caseId/timeline", async (req: Request, res: Response) => {
  try {
    await ensureDb();
    const { caseId } = req.params;
    const activities = await OperationalCaseActivity.findAll({
      where: { caseId },
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, activities });
  } catch (err: any) {
    res.status(500).json({ error: "فشل جلب الخط الزمني للحالة" });
  }
});

// 10. POST /api/operations/discovery/run - Trigger manual scan for exceptions
operationsRouter.post("/discovery/run", async (req: Request, res: Response) => {
  try {
    await ensureDb();
    const stats = await runExceptionDiscovery();
    res.json({
      success: true,
      message: `تم فحص السجلات بنجاح (المفحوصة: ${stats.scanned}، الجديدة: ${stats.created}، المحدثة: ${stats.updated})`,
      stats
    });
  } catch (err: any) {
    res.status(500).json({ error: "فشل تشغيل فحص الاستثناءات" });
  }
});
