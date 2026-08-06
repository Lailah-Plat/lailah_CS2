import dotenv from "dotenv";
dotenv.config();

/**
 * Interface for Zoho Desk Configuration
 */
export interface ZohoDeskConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  orgId: string;
  departmentId: string;
  domain: string; // e.g. 'com', 'eu', 'sa', 'in'
  enabled: boolean;
}

/**
 * Interface for Ticket creation payload from Layla Platform
 */
export interface ZohoTicketPayload {
  customerName: string;
  email: string;
  subject: string;
  description: string;
  bookingId?: string;
  departmentId?: string;
  priority?: 'High' | 'Medium' | 'Low' | string;
  phone?: string;
}

/**
 * Interface for Zoho Desk API Ticket Response
 */
export interface ZohoTicketResponse {
  success: boolean;
  disabled?: boolean;
  ticketId?: string;
  ticketNumber?: string;
  webUrl?: string;
  error?: string;
  details?: any;
}

// In-Memory Token Cache to prevent unnecessary refresh API calls
interface TokenCache {
  accessToken: string | null;
  expiresAt: number; // Unix timestamp in milliseconds
}

const tokenCache: TokenCache = {
  accessToken: null,
  expiresAt: 0
};

// Dynamic runtime enabled toggle state (fallback when database state is modified at runtime)
let runtimeEnabledOverride: boolean | null = null;

/**
 * Retrieves current Zoho Desk configuration from environment variables & dynamic settings
 */
export function getZohoDeskConfig(): ZohoDeskConfig {
  const enabledEnv = process.env.ZOHO_DESK_ENABLED;
  const isEnabled = runtimeEnabledOverride !== null 
    ? runtimeEnabledOverride 
    : (enabledEnv !== 'false' && enabledEnv !== '0' && Boolean(enabledEnv));

  return {
    clientId: process.env.ZOHO_CLIENT_ID || "",
    clientSecret: process.env.ZOHO_CLIENT_SECRET || "",
    refreshToken: process.env.ZOHO_REFRESH_TOKEN || "",
    orgId: process.env.ZOHO_ORG_ID || "",
    departmentId: process.env.ZOHO_DEPARTMENT_ID || "",
    domain: (process.env.ZOHO_DOMAIN || "com").toLowerCase().trim(),
    enabled: isEnabled
  };
}

/**
 * Dynamically updates the runtime enabled state (used by Admin Toggle Switch)
 */
export function setZohoDeskRuntimeEnabled(enabled: boolean): void {
  runtimeEnabledOverride = enabled;
  console.log(`[Zoho Desk Service] 🔄 Integration status updated to: ${enabled ? 'ENABLED ✅' : 'DISABLED ❌'}`);
}

/**
 * Resolves the Zoho Accounts Domain based on region (com, eu, sa, in)
 */
function getAccountsDomain(domain: string): string {
  switch (domain) {
    case 'eu': return 'https://accounts.zoho.eu';
    case 'sa': return 'https://accounts.zoho.sa';
    case 'in': return 'https://accounts.zoho.in';
    case 'au': return 'https://accounts.zoho.com.au';
    default: return 'https://accounts.zoho.com';
  }
}

/**
 * Resolves the Zoho Desk REST API Base Domain based on region
 */
function getDeskApiDomain(domain: string): string {
  switch (domain) {
    case 'eu': return 'https://desk.zoho.eu';
    case 'sa': return 'https://desk.zoho.sa';
    case 'in': return 'https://desk.zoho.in';
    case 'au': return 'https://desk.zoho.com.au';
    default: return 'https://desk.zoho.com';
  }
}

/**
 * Maps input priorities to official Zoho Desk Priority values
 */
function mapPriority(priority?: string): 'High' | 'Medium' | 'Low' {
  if (!priority) return 'Medium';
  const p = priority.toLowerCase().trim();
  if (p === 'high' || p === 'عالية' || p === 'عالية جداً' || p === 'عالية جدا') return 'High';
  if (p === 'low' || p === 'منخفضة') return 'Low';
  return 'Medium';
}

/**
 * Refreshes OAuth 2.0 Access Token from Zoho OAuth Server using Refresh Token
 */
export async function refreshZohoAccessToken(forceRefresh = false): Promise<string> {
  const config = getZohoDeskConfig();

  // Return cached token if valid and not forcing refresh
  if (!forceRefresh && tokenCache.accessToken && Date.now() < tokenCache.expiresAt) {
    return tokenCache.accessToken;
  }

  if (!config.clientId || !config.clientSecret || !config.refreshToken) {
    const errorMsg = "❌ [Zoho OAuth Error] Missing required Zoho OAuth credentials (ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, or ZOHO_REFRESH_TOKEN).";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const accountsDomain = getAccountsDomain(config.domain);
  const tokenUrl = `${accountsDomain}/oauth/v2/token`;

  const params = new URLSearchParams({
    refresh_token: config.refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: "refresh_token"
  });

  console.log(`[Zoho OAuth] 🔑 Requesting new Access Token from ${accountsDomain}...`);

  try {
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });

    const data: any = await response.json();

    if (!response.ok || data.error) {
      const errorDetail = data.error || response.statusText;
      console.error(`[Zoho OAuth Error] Failed to refresh token: ${errorDetail}`, data);
      throw new Error(`Zoho OAuth Refresh Failed: ${errorDetail}`);
    }

    if (!data.access_token) {
      console.error("[Zoho OAuth Error] Access token missing in response:", data);
      throw new Error("No access_token returned by Zoho OAuth server.");
    }

    // Default expiration is 3600 seconds (1 hour). Refresh 5 minutes early for safety.
    const expiresInSec = data.expires_in || 3600;
    tokenCache.accessToken = data.access_token;
    tokenCache.expiresAt = Date.now() + (expiresInSec - 300) * 1000;

    console.log(`[Zoho OAuth Success] 🟢 Access Token retrieved successfully. Valid for ${expiresInSec}s.`);
    return data.access_token;
  } catch (err: any) {
    console.error("[Zoho OAuth Exception]:", err.message);
    throw err;
  }
}

/**
 * Main Function: Creates a Ticket in Zoho Desk via REST API
 */
export async function createZohoDeskTicket(payload: ZohoTicketPayload): Promise<ZohoTicketResponse> {
  const config = getZohoDeskConfig();

  // 1. Check if Integration is Enabled
  if (!config.enabled) {
    console.log("[Zoho Desk Service] ⚠️ Integration is currently DISABLED. Ticket generation skipped.");
    return {
      success: false,
      disabled: true,
      error: "Zoho Desk integration is currently disabled in system settings."
    };
  }

  // 2. Validate essential configurations
  if (!config.orgId) {
    console.warn("[Zoho Desk Warning] ZOHO_ORG_ID is missing.");
    return {
      success: false,
      error: "ZOHO_ORG_ID configuration is missing."
    };
  }

  try {
    // 3. Obtain valid OAuth Access Token
    const accessToken = await refreshZohoAccessToken();

    // 4. Construct Zoho Desk Ticket Payload according to Data Mapping requirements
    const formattedDescription = [
      payload.description,
      "",
      "----------------------------------------",
      "📌 تفاصيل البلاغ من منصة ليلة (Layla Platform):",
      `• اسم العميل: ${payload.customerName || 'غير محدد'}`,
      `• البريد الإلكتروني: ${payload.email || 'غير محدد'}`,
      payload.phone ? `• رقم التواصل: ${payload.phone}` : null,
      payload.bookingId ? `• رقم حجز المناسبة: ${payload.bookingId}` : '• رقم حجز المناسبة: لا يوجد حجز مرتبط',
      `• تاريخ وتوقيت البلاغ: ${new Date().toLocaleString('ar-SA')}`
    ].filter(line => line !== null).join("\n");

    const ticketBody = {
      subject: payload.subject || "طلب دعم فني / شكوى جديدة - منصة ليلة",
      description: formattedDescription,
      departmentId: payload.departmentId || config.departmentId || undefined,
      contact: {
        lastName: payload.customerName || "عميل منصة ليلة",
        email: payload.email
      },
      priority: mapPriority(payload.priority)
    };

    const deskDomain = getDeskApiDomain(config.domain);
    const ticketsEndpoint = `${deskDomain}/api/v1/tickets`;

    console.log(`[Zoho Desk API] 🚀 Creating Ticket at ${ticketsEndpoint}...`);

    let response = await fetch(ticketsEndpoint, {
      method: "POST",
      headers: {
        "Authorization": `Zoho-oauthtoken ${accessToken}`,
        "orgId": config.orgId,
        "Content-Type": "application/json;charset=UTF-8"
      },
      body: JSON.stringify(ticketBody)
    });

    // Handle 401 Unauthorized (token might have expired prematurely)
    if (response.status === 401) {
      console.warn("[Zoho Desk API] ⚠️ 401 Unauthorized encountered. Retrying with forced token refresh...");
      const freshToken = await refreshZohoAccessToken(true);
      response = await fetch(ticketsEndpoint, {
        method: "POST",
        headers: {
          "Authorization": `Zoho-oauthtoken ${freshToken}`,
          "orgId": config.orgId,
          "Content-Type": "application/json;charset=UTF-8"
        },
        body: JSON.stringify(ticketBody)
      });
    }

    const responseData: any = await response.json();

    if (!response.ok) {
      console.error(`[Zoho Desk API Error] Status ${response.status}:`, responseData);
      return {
        success: false,
        error: responseData.message || responseData.errorCode || `Zoho Desk API HTTP ${response.status}`,
        details: responseData
      };
    }

    console.log(`[Zoho Desk API Success] 🎉 Ticket Created Successfully! Ticket Number: ${responseData.ticketNumber || responseData.id}`);

    return {
      success: true,
      ticketId: responseData.id,
      ticketNumber: responseData.ticketNumber,
      webUrl: responseData.webUrl || `${deskDomain}/support/${config.orgId}/ShowTicket.do?extId=${responseData.id}`,
      details: responseData
    };

  } catch (err: any) {
    console.error("[Zoho Desk Service Error]:", err.message || err);
    return {
      success: false,
      error: err.message || "فشل الاتصال بخادم Zoho Desk REST API"
    };
  }
}
