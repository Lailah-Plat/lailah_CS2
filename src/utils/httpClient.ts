/**
 * @file httpClient.ts
 * @description عميل طلبات HTTP المتقدم والمرن لمنصة "ليلة".
 * يوفر آلية تنفيذ الاستدعاءات الخارجية مع الدعم التلقائي لإعادة المحاولة عند الفشل (Retry with Exponential Backoff) والمهلة الزمنية (Timeout).
 */

const HttpLogger = {
  debug: (msg: string) => console.debug(`[HTTP Client] ${msg}`),
  warn: (msg: string) => console.warn(`[HTTP Client] ${msg}`),
  error: (msg: string, err?: any) => console.error(`[HTTP Client] ${msg}`, err || ''),
  info: (msg: string) => console.info(`[HTTP Client] ${msg}`)
};

/**
 * واجهة خيارات وإعدادات عميل HTTP
 */
export interface HttpClientOptions {
  /** المهلة الزمنية القصوى بالملي ثانية قبل إلغاء الطلب */
  timeoutMs?: number;
  /** عدد محاولات إعادة الاتصال عند الفشل */
  retries?: number;
  /** زمن الانتظار الأساسي بالملي ثانية بين المحاولات */
  backoffMs?: number;
  /** الهيدرات المخصصة للطلب */
  headers?: Record<string, string>;
}

/**
 * فئة خطأ HTTP المخصص المحتوي على تفاصيل استجابة السيرفر
 */
export class HttpError extends Error {
  constructor(
    public statusCode: number,
    public statusText: string,
    public body: string,
    message: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/**
 * العميل الرئيسي لطلبات الشبكة HTTP
 */
export class HttpClient {
  /** المهلة الزمنية الافتراضية (10 ثوانٍ) */
  private static DEFAULT_TIMEOUT = 10000;
  /** عدد المحاولات الافتراضي (3 محاولات) */
  private static DEFAULT_RETRIES = 3;
  /** زمن التراجع الأسّي الافتراضي (ثانية واحدة) */
  private static DEFAULT_BACKOFF = 1000;

  /**
   * تنفيذ طلب HTTP ذكي مع دعم مهلة التوقف وإعادة المحاولة التلقائية
   * @param url رابط النقطة النهائية (URL)
   * @param method نوع الطلب (GET, POST, PUT, DELETE)
   * @param body بيانات جسم الطلب (إن وجدت)
   * @param options خيارات وإعدادات الطلب
   * @returns الاستجابة المعالجة (JSON أو النص)
   */
  static async request(
    url: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    body?: any,
    options: HttpClientOptions = {}
  ): Promise<any> {
    const {
      timeoutMs = this.DEFAULT_TIMEOUT,
      retries = this.DEFAULT_RETRIES,
      backoffMs = this.DEFAULT_BACKOFF,
      headers = {},
    } = options;

    let attempt = 0;
    while (attempt < retries) {
      attempt++;
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);

      try {
        HttpLogger.debug(`طلب خارجي: [${method}] ${url} | المحاولة ${attempt}/${retries}`);
        
        const fetchOptions: RequestInit = {
          method,
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          signal: controller.signal,
        };

        if (body) {
          fetchOptions.body = typeof body === "string" ? body : JSON.stringify(body);
        }

        const response = await fetch(url, fetchOptions);
        clearTimeout(id);

        if (!response.ok) {
          const errorBody = await response.text();
          throw new HttpError(
            response.status,
            response.statusText,
            errorBody,
            `رمز الاستجابة ${response.status} (${response.statusText}) من الطلب الخارجي.`
          );
        }

        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          return await response.json();
        } else {
          return await response.text();
        }

      } catch (err: any) {
        clearTimeout(id);
        
        const isTimeout = err.name === "AbortError";
        const errorMsg = isTimeout
          ? `انتهت المهلة الزمنية للطلب بعد ${timeoutMs} ملي ثانية`
          : err.message || "خطأ غير معروف";

        HttpLogger.warn(
          `فشل الاستدعاء الخارجي: [${method}] ${url} | المحاولة ${attempt}/${retries} | الخطأ: ${errorMsg}`
        );

        // في حال استنفاد جميع المحاولات المتاحة
        if (attempt >= retries) {
          HttpLogger.error(`استنفد الطلب الخارجي كافة المحاولات وفشل بشكل دائم: [${method}] ${url}`, err);
          throw err;
        }

        // حساب وقت الانتظار والتراجع الأسّي (Exponential Backoff)
        const delay = backoffMs * Math.pow(2, attempt - 1);
        HttpLogger.debug(`انتظار التراجع الأسّي: ${delay} ملي ثانية قبل إعادة المحاولة...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  /** طلب من نوع GET */
  static async get(url: string, options?: HttpClientOptions): Promise<any> {
    return this.request(url, "GET", undefined, options);
  }

  /** طلب من نوع POST */
  static async post(url: string, body: any, options?: HttpClientOptions): Promise<any> {
    return this.request(url, "POST", body, options);
  }

  /** طلب من نوع PUT */
  static async put(url: string, body: any, options?: HttpClientOptions): Promise<any> {
    return this.request(url, "PUT", body, options);
  }

  /** طلب من نوع DELETE */
  static async delete(url: string, options?: HttpClientOptions): Promise<any> {
    return this.request(url, "DELETE", undefined, options);
  }
}

