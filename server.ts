import express from "express";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import fs from "fs";
import path from "path";
import paymentRouter from "./src/modules/finance/payment.routes.js";
import supportRouter, { startSLAWorker } from "./src/modules/support/support.routes.js";
import aiRouter from "./src/modules/ai/ai.routes.js";
import employeeRouter from "./src/modules/employee/employee.routes.js";
import bookingRouter from "./src/modules/booking/booking.routes.js";
import marketingRouter from "./src/modules/marketing/marketing.routes.js";
import authRouter from "./src/modules/user/auth.routes.js";
import userRouter from "./src/modules/user/user.routes.js";
import financeRouter from "./src/modules/finance/finance.routes.js";
import securityRouter from "./src/modules/security/security.routes.js";
import feedbackRouter from "./src/modules/feedback/feedback.routes.js";
import subscriptionRouter from "./src/modules/subscription/subscription.routes.js";
import favoriteRouter from "./src/modules/favorite/favorite.routes.js";
import zohoDeskRouter from "./src/modules/integrations/zohoDesk.routes.js";
import phasesRouter from "./src/modules/phases/phases.routes.js";
import { webhookRouter } from "./src/modules/webhooks/webhookRouter.js";
import { smsRouter } from "./src/modules/notifications/smsRouter.js";
import { iCalRouter } from "./src/modules/calendar/iCalRouter.js";
import { affiliatesRouter } from "./src/modules/marketing/affiliatesRouter.js";
import { featureAdoptionRouter } from "./src/modules/analytics/featureAdoptionRouter.js";
import { syncDatabase } from "./src/models/Database.js";
import { syncUserModels } from "./src/models/UserModels.js";
import { syncBookingModels } from "./src/models/BookingModels.js";
import { syncMarketingModels } from "./src/models/MarketingModels.js";
import { syncSupportModels } from "./src/models/SupportModels.js";
import { syncFeedbackModels } from "./src/models/FeedbackModels.js";
import { syncSubscriptionModels } from "./src/models/SubscriptionModels.js";
import { syncFavorites } from "./src/models/FavoriteModels.js";
import { syncAdvancedPhaseModels } from "./src/models/AdvancedPhaseModels.js";
import { runStartupDataMigration } from "./src/utils/phoneMigration.js";
import { loggerMiddleware } from "./src/middleware/logger.middleware.js";
import { errorMiddleware } from "./src/middleware/error.middleware.js";
import dotenv from "dotenv";
import { Server as SocketIOServer } from "socket.io";
import { initLiveChatSocket } from "./src/modules/support/liveChat.socket.js";
import http from "http";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize DB in the background to avoid blocking server port binding
  (async () => {
    try {
      console.log("🔄 [Background] Synchronizing database models sequentially to prevent locks...");
      
      const syncSteps = [
        { name: "Database (Core)", fn: syncDatabase },
        { name: "User Models", fn: syncUserModels },
        { name: "Booking Models", fn: syncBookingModels },
        { name: "Marketing Models", fn: syncMarketingModels },
        { name: "Support Models", fn: syncSupportModels },
        { name: "Feedback Models", fn: syncFeedbackModels },
        { name: "Subscription Models", fn: syncSubscriptionModels },
        { name: "Favorite Models", fn: syncFavorites },
        { name: "Advanced Phase Models", fn: syncAdvancedPhaseModels }
      ];

      for (const step of syncSteps) {
        try {
          console.log(`⏳ [Background] Syncing ${step.name}...`);
          await step.fn();
          console.log(`✅ [Background] ${step.name} synced.`);
        } catch (stepError: any) {
          console.error(`⚠️ [Background] Non-blocking warning: Failed to sync ${step.name}:`, stepError.message || stepError);
        }
      }

      console.log("✅ [Background] Database initialization pipeline finished.");
      
      // Execute the strict startup phone & IBAN normalization data migration
      await runStartupDataMigration();
    } catch (dbError: any) {
      console.error("❌ [Background] database sync failed completely.");
    }
  })();

  // Use raw body for webhooks, JSON for everything else
  app.use((req, res, next) => {
    if (req.originalUrl.includes("/webhook")) {
      express.raw({ type: "application/json", limit: "50mb" })(req, res, next);
    } else {
      express.json({ limit: "50mb" })(req, res, next);
    }
  });
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Request logger middleware
  app.use(loggerMiddleware);

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      service: "Laylah Event Platform Core API"
    });
  });

  app.get("/api/health/metrics", (req, res) => {
    const memory = process.memoryUsage();
    const io = app.get("io");
    const connectedSocketsCount = io ? io.sockets.sockets.size : 0;

    res.json({
      success: true,
      serverTime: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || "development",
      nodeVersion: process.version,
      memoryUsage: {
        rssMB: Math.round(memory.rss / (1024 * 1024)),
        heapTotalMB: Math.round(memory.heapTotal / (1024 * 1024)),
        heapUsedMB: Math.round(memory.heapUsed / (1024 * 1024)),
        externalMB: Math.round(memory.external / (1024 * 1024))
      },
      webSockets: {
        status: "active",
        connectedClients: connectedSocketsCount
      },
      subsystems: {
        database: "connected",
        webhookListener: "listening",
        smsWhatsappGateway: "ready",
        icalCalendarEngine: "active",
        zatcaInvoicing: "ready",
        aiSmartPricing: "online"
      }
    });
  });

  // System general config key-value endpoints with high-reliability sync & telemetry
  app.get("/api/system/configs", async (req, res) => {
    // Force strict browser/intermediary cache disabling to prevent data-freezing
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    try {
      const { PlatformConfig } = await import("./src/models/UserModels.js");
      const configs = await PlatformConfig.findAll();
      const result: Record<string, any> = {};
      configs.forEach(c => {
        try {
          result[c.key] = JSON.parse(c.value);
        } catch {
          result[c.key] = c.value;
        }
      });
      res.json({ success: true, configs: result, source: 'database', databaseHealthy: true });
    } catch (err: any) {
      console.warn("⚠️ Database query error while loading system settings. Activating live fallback:", err.message);
      // Fail-safe protection: rather than a crashing 500 block, return empty with explicit fallback indicator
      res.json({
        success: true,
        configs: {},
        fallback: true,
        source: 'local-fallback',
        databaseHealthy: false,
        error: err.message
      });
    }
  });

  app.post("/api/system/configs", async (req, res) => {
    try {
      const { PlatformConfig } = await import("./src/models/UserModels.js");
      const { key, value } = req.body;
      if (!key) {
        return res.status(400).json({ success: false, error: "Key is required" });
      }
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      
      const [config, created] = await PlatformConfig.findOrCreate({
        where: { key },
        defaults: { key, value: stringValue }
      });
      if (!created) {
        await config.update({ value: stringValue });
      }

      // Live socket.io update broadcasting to all clients immediately
      const io = req.app.get("io");
      if (io) {
        io.emit("system_config_updated", { key, value, timestamp: Date.now() });
      }

      res.json({ success: true, key, value, liveBroadcast: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Ensure public/uploads directories exist
  const hallsUploadDir = path.join(process.cwd(), "public", "uploads", "halls");
  const servicesUploadDir = path.join(process.cwd(), "public", "uploads", "services");
  
  if (!fs.existsSync(hallsUploadDir)) {
    fs.mkdirSync(hallsUploadDir, { recursive: true });
  }
  if (!fs.existsSync(servicesUploadDir)) {
    fs.mkdirSync(servicesUploadDir, { recursive: true });
  }

  // Serve static uploads
  app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));
  
  // Ensure docsimg directory exists and serve it publicly
  const docsUploadDir = path.join(process.cwd(), "public", "images", "halls", "docsimg");
  if (!fs.existsSync(docsUploadDir)) {
    fs.mkdirSync(docsUploadDir, { recursive: true });
  }
  app.use("/images", express.static(path.join(process.cwd(), "public", "images")));

  // Ensure AvatarCustomers directory exists and serve it publicly
  const avatarUploadDir = path.join(process.cwd(), "public", "AvatarCustomers");
  if (!fs.existsSync(avatarUploadDir)) {
    fs.mkdirSync(avatarUploadDir, { recursive: true });
  }
  app.use("/AvatarCustomers", express.static(avatarUploadDir));

  // Multer memory storage configuration (completely avoids destination folder crash during file parsing)
  const memoryStorage = multer.memoryStorage();
  const upload = multer({
    storage: memoryStorage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
  });

  // Helper to extract uploaded file regardless of field name (image, file, video, etc.)
  const getFileFromRequest = (req: any) => {
    if (req.file) return req.file;
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      return req.files[0];
    }
    return undefined;
  };

  // Upload endpoint (Single file)
  app.post("/api/upload", upload.any(), (req, res) => {
    try {
      const file = getFileFromRequest(req);
      if (!file) {
        return res.status(400).json({ error: "لم يتم تحديد أي ملف للرفع" });
      }
      
      const type = String(req.query.type || "").toLowerCase();
      let folder = "halls";
      let prefix = "hall-";

      if (type === "service" || type === "services") {
        folder = "services";
        prefix = "service-";
      } else if (type === "avatar") {
        folder = "avatars";
        prefix = "avatar-";
      } else if (type === "branding") {
        folder = "branding";
        prefix = "branding-";
      } else if (type === "hall_document" || type === "docs") {
        folder = "halls";
        prefix = "doc-";
      } else if (type === "finance" || type === "receipt") {
        folder = "finance";
        prefix = "receipt-";
      } else if (type === "video") {
        folder = "videos";
        prefix = "video-";
      }

      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const filename = prefix + uniqueSuffix + path.extname(file.originalname || ".jpg");
      
      const targetDir = path.join(process.cwd(), "public", "uploads", folder);
      const imageUrl = `/uploads/${folder}/${filename}`;
      const targetFile = path.join(targetDir, filename);

      try {
        // Ensure folder exists
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        // Attempt to write file to disk
        fs.writeFileSync(targetFile, file.buffer);
        console.log(`Successfully saved uploaded file to disk: ${targetFile}`);
        res.json({ success: true, url: imageUrl });
      } catch (diskError: any) {
        console.warn("⚠️ Disk storage write failed. Falling back to base64 Data URL:", diskError.message);
        
        // Convert the memory buffer to base64 Data URI as a fallback
        const mimeType = file.mimetype || "image/jpeg";
        const base64Data = file.buffer.toString("base64");
        const base64Url = `data:${mimeType};base64,${base64Data}`;
        
        res.json({ success: true, url: base64Url });
      }
    } catch (err: any) {
      console.error("Upload handler crash:", err);
      res.status(500).json({ error: "خطأ أثناء حفظ الصورة في الخادم" });
    }
  });

  // Download external image and save to server to avoid CORS/broken external URLs
  app.post("/api/upload-external", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "الرجاء تزويد رابط الصورة" });
      }

      // If already a local URL or data URI, return as-is
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return res.json({ success: true, url });
      }

      console.log(`[Upload External] Downloading: ${url}`);
      let buffer: Buffer;
      let contentType = "image/jpeg";

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        contentType = response.headers.get("content-type") || "image/jpeg";
        const arrayBuffer = await response.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      } catch (fetchError: any) {
        console.warn(`[Upload External] fetch failed, attempting standard https request fallback:`, fetchError.message);
        // Fallback to standard Node https
        const https = require("https");
        const downloadPromise = () => new Promise<[Buffer, string]>((resolve, reject) => {
          https.get(url, (response: any) => {
            if (response.statusCode !== 200) {
              reject(new Error(`Failed to fetch image: status ${response.statusCode}`));
              return;
            }
            const type = response.headers["content-type"] || "image/jpeg";
            const chunks: any[] = [];
            response.on("data", (chunk: any) => chunks.push(chunk));
            response.on("end", () => {
              resolve([Buffer.concat(chunks), type]);
            });
            response.on("error", (err: any) => reject(err));
          }).on("error", (err: any) => reject(err));
        });
        const [fallbackBuffer, fallbackType] = await downloadPromise();
        buffer = fallbackBuffer;
        contentType = fallbackType;
      }

      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      let ext = ".jpg";
      if (contentType.includes("image/png")) ext = ".png";
      else if (contentType.includes("image/gif")) ext = ".gif";
      else if (contentType.includes("image/webp")) ext = ".webp";
      else if (contentType.includes("image/svg+xml")) ext = ".svg";

      const filename = "region-" + uniqueSuffix + ext;
      const targetDir = path.join(process.cwd(), "public", "uploads", "regions");
      const targetFile = path.join(targetDir, filename);
      const imageUrl = `/uploads/regions/${filename}`;

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      fs.writeFileSync(targetFile, buffer);
      console.log(`[Upload External] Saved to disk: ${targetFile}`);
      res.json({ success: true, url: imageUrl });
    } catch (err: any) {
      console.error("[Upload External] crash:", err);
      res.status(500).json({ error: "فشل في تحميل وحفظ الصورة الخارجية على الخادم" });
    }
  });

  // Avatar dedicated upload endpoint (saves file into public/uploads/avatars)
  app.post("/api/upload-avatar", upload.any(), (req, res) => {
    try {
      const file = getFileFromRequest(req);
      if (!file) {
        return res.status(400).json({ error: "لم يتم تحديد أي صورة للرفع" });
      }
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const filename = "avatar-" + uniqueSuffix + path.extname(file.originalname || ".jpg");
      const targetDir = path.join(process.cwd(), "public", "uploads", "avatars");
      const targetFile = path.join(targetDir, filename);
      const imageUrl = `/uploads/avatars/${filename}`;

      try {
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        fs.writeFileSync(targetFile, file.buffer);
        console.log(`Successfully saved avatar to disk: ${targetFile}`);
        res.json({ success: true, url: imageUrl });
      } catch (diskError: any) {
        console.warn("⚠️ Disk storage write failed. Falling back to base64 Data URL:", diskError.message);
        const mimeType = file.mimetype || "image/jpeg";
        const base64Data = file.buffer.toString("base64");
        const base64Url = `data:${mimeType};base64,${base64Data}`;
        res.json({ success: true, url: base64Url });
      }
    } catch (err: any) {
      console.error("Avatar upload handler crash:", err);
      res.status(500).json({ error: "خطأ أثناء حفظ الصورة الشخصية في الخادم" });
    }
  });

  app.use("/api/payment", paymentRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/users", userRouter);
  app.use("/api/support", supportRouter);
  app.use("/api/hr", employeeRouter);
  app.use("/api/bookings", bookingRouter);
  app.use("/api/halls", (req, res, next) => {
    req.url = req.url === "/" || req.url === "" ? "/halls" : "/halls" + req.url;
    bookingRouter(req, res, next);
  });
  app.use("/api/services", (req, res, next) => {
    req.url = req.url === "/" || req.url === "" ? "/services" : "/services" + req.url;
    bookingRouter(req, res, next);
  });
  app.use("/api/marketing/affiliates", affiliatesRouter);
  app.use("/api/marketing", marketingRouter);
  app.use("/api/analytics/feature-adoption", featureAdoptionRouter);
  app.use("/api/ai", aiRouter);
  app.use("/api/finance", financeRouter);
  app.use("/api/security", securityRouter);
  app.use("/api/feedback", feedbackRouter);
  app.use("/api/subscriptions", subscriptionRouter);
  app.use("/api/favorites", favoriteRouter);
  app.use("/api/integrations/zoho-desk", zohoDeskRouter);
  app.use("/api/phases", phasesRouter);
  app.use("/api/webhooks", webhookRouter);
  app.use("/api/notifications/sms", smsRouter);
  app.use("/api/calendar", iCalRouter);

  // 404 handler for API routes to prevent Vite SPA fallback from returning index.html (HTML)
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.originalUrl.startsWith('/api') || req.url.startsWith('/api')) {
      return res.status(404).json({ success: false, error: `API endpoint ${req.originalUrl || req.url} not found` });
    }
    next();
  });

  // JSON Error Handler for API routes to prevent HTML error fallbacks
  app.use(errorMiddleware);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const httpServer = http.createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: { origin: "*" }
  });

  app.set("io", io);

  initLiveChatSocket(io);

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    
    socket.on("join_ticket", (ticketId) => {
      socket.join(`ticket_${ticketId}`);
      console.log(`Socket ${socket.id} joined ticket ${ticketId}`);
    });
    
    socket.on("typing", (data) => {
      socket.to(`ticket_${data.ticketId}`).emit("typing", data);
    });
    
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  // Start SLA Background Worker
  startSLAWorker(io);

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
