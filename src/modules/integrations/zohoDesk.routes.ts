import { Router, Request, Response } from "express";
import { 
  createZohoDeskTicket, 
  getZohoDeskConfig, 
  refreshZohoAccessToken, 
  setZohoDeskRuntimeEnabled,
  ZohoTicketPayload 
} from "./zohoDesk.service.js";

const router = Router();

/**
 * 1. Webhook Endpoint: Handles complaints & booking issues from Layla Platform
 * Trigger: When a client submits a complaint or encounters a booking issue.
 */
router.post("/webhook", async (req: Request, res: Response) => {
  const timestamp = new Date().toISOString();
  console.log(`[Zoho Webhook] 📩 Incoming Webhook Payload received at ${timestamp}`);

  try {
    let body = req.body;

    // Handle raw Buffer body if express.raw was triggered
    if (Buffer.isBuffer(body)) {
      try {
        body = JSON.parse(body.toString('utf-8'));
      } catch (parseErr) {
        console.error("[Zoho Webhook Error] Invalid JSON buffer payload");
        return res.status(400).json({ success: false, error: "Invalid JSON payload" });
      }
    }

    // Support both snake_case and camelCase payload variations
    const customerName = body.contactName || body.customerName || body.name || body.clientName || "عميل منصة ليلة";
    const email = body.email || body.customerEmail || body.clientEmail || "";
    const subject = body.subject || body.title || body.issueTitle || "شكوى / مشكلة جديدة على منصة ليلة";
    const description = body.description || body.details || body.complaintText || body.message || "لا توجد تفاصيل إضافية";
    const bookingId = body.bookingId || body.orderNumber || body.reservationNumber || body.bkgId || "";
    const departmentId = body.departmentId || undefined;
    const priority = body.priority || "Medium";
    const phone = body.phone || body.mobile || body.customerPhone || "";

    if (!email) {
      console.warn("[Zoho Webhook Warning] Webhook payload is missing mandatory customer email address.");
      return res.status(400).json({
        success: false,
        error: "بيانات البريد الإلكتروني للعميل (email) مطلوبة لإيجاد أو تعيين جهة الاتصال في Zoho Desk."
      });
    }

    const ticketPayload: ZohoTicketPayload = {
      customerName,
      email,
      subject,
      description,
      bookingId,
      departmentId,
      priority,
      phone
    };

    console.log(`[Zoho Webhook Processing] Mapping ticket for Customer "${customerName}" (${email}) - Booking: ${bookingId || 'N/A'}`);

    const result = await createZohoDeskTicket(ticketPayload);

    if (result.disabled) {
      return res.status(200).json({
        success: true,
        zohoDeskEnabled: false,
        message: "تكامل Zoho Desk معطل حالياً في إعدادات النظام. تم استلام البلاغ محلياً فقط."
      });
    }

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        details: result.details
      });
    }

    return res.status(201).json({
      success: true,
      message: "تم استقبال الشكوى وإصدار تذكرة دعم فني تلقائياً في Zoho Desk بنجاح",
      ticketId: result.ticketId,
      ticketNumber: result.ticketNumber,
      webUrl: result.webUrl
    });

  } catch (err: any) {
    console.error("[Zoho Webhook Fatal Error]:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "خطأ داخلي أثناء معالجة Webhook"
    });
  }
});

/**
 * 2. Direct API Endpoint to create a Ticket programmatically or from UI
 */
router.post("/create-ticket", async (req: Request, res: Response) => {
  try {
    const { contactName, customerName, email, subject, description, bookingId, departmentId, priority, phone } = req.body;

    const targetEmail = email || req.body.customerEmail;
    if (!targetEmail) {
      return res.status(400).json({ success: false, error: "البريد الإلكتروني للعميل مطلوب" });
    }

    const payload: ZohoTicketPayload = {
      customerName: contactName || customerName || "عميل منصة ليلة",
      email: targetEmail,
      subject: subject || "تذكرة دعم فني جديدة",
      description: description || "",
      bookingId,
      departmentId,
      priority,
      phone
    };

    const result = await createZohoDeskTicket(payload);
    return res.json(result);

  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 3. Status & Diagnostic Endpoint
 * Returns configuration details (masked) and tests OAuth token connectivity
 */
router.get("/status", async (req: Request, res: Response) => {
  const config = getZohoDeskConfig();

  const maskSecret = (str: string) => {
    if (!str || str.length <= 6) return str ? "*****" : "غير محدد";
    return `${str.substring(0, 3)}...${str.substring(str.length - 3)}`;
  };

  let oAuthHealthy = false;
  let oAuthError: string | null = null;

  if (config.enabled && config.clientId && config.refreshToken) {
    try {
      await refreshZohoAccessToken();
      oAuthHealthy = true;
    } catch (err: any) {
      oAuthHealthy = false;
      oAuthError = err.message;
    }
  }

  res.json({
    success: true,
    enabled: config.enabled,
    config: {
      clientId: maskSecret(config.clientId),
      clientSecret: maskSecret(config.clientSecret),
      refreshToken: maskSecret(config.refreshToken),
      orgId: config.orgId || "غير محدد",
      departmentId: config.departmentId || "غير محدد",
      domain: config.domain,
      isConfigured: Boolean(config.clientId && config.clientSecret && config.refreshToken && config.orgId)
    },
    oAuthStatus: {
      healthy: oAuthHealthy,
      error: oAuthError
    }
  });
});

/**
 * 4. Toggle Integration Endpoint (Enable/Disable)
 */
router.post("/toggle", async (req: Request, res: Response) => {
  try {
    const { enabled } = req.body;
    const isEnabled = Boolean(enabled);

    setZohoDeskRuntimeEnabled(isEnabled);

    // Save setting to DB PlatformConfig
    try {
      const { PlatformConfig } = await import("../../models/UserModels.js");
      const [cfg, created] = await PlatformConfig.findOrCreate({
        where: { key: "ZOHO_DESK_ENABLED" },
        defaults: { key: "ZOHO_DESK_ENABLED", value: String(isEnabled) }
      });
      if (!created) {
        await cfg.update({ value: String(isEnabled) });
      }
    } catch (dbErr: any) {
      console.warn("⚠️ Could not persist ZOHO_DESK_ENABLED to database:", dbErr.message);
    }

    res.json({
      success: true,
      enabled: isEnabled,
      message: isEnabled 
        ? "تم تفعيل التكادلم مع Zoho Desk بنجاح" 
        : "تم تعطيل التكادلم مع Zoho Desk"
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 5. Test OAuth Token Refresh directly
 */
router.post("/test-auth", async (req: Request, res: Response) => {
  try {
    const accessToken = await refreshZohoAccessToken(true);
    res.json({
      success: true,
      message: "تم تحديث Access Token واختبار الربط بنجاح مع خوادم Zoho OAuth!",
      tokenPreview: `${accessToken.substring(0, 8)}...`
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "فشل اختبار الاتصال بـ Zoho OAuth"
    });
  }
});

export default router;
