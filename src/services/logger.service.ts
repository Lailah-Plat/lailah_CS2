/**
 * @file logger.service.ts
 * @description خدمة تسجيل الأحداث والتسجيل المتقدم والأمنية والمالية (Logger & Audit Service) لمنصة "ليلة".
 * تقوم بحفظ السجلات على القرص المحلي وإخراجها ملونة في الطرفية (Console) مع تصنيف المستويات (معلومات، تحذير، خطأ، مالي، أمني).
 */

import fs from "fs";
import path from "path";

/** أنواع ومستويات السجلات المتاحة */
export type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG" | "FINANCIAL" | "SECURITY";

/**
 * فئة إدارة السجلات والتدقيق المتقدم
 */
export class Logger {
  private static logDir = path.join(process.cwd(), "logs");
  private static logFile = path.join(Logger.logDir, "app.log");

  static {
    try {
      if (!fs.existsSync(Logger.logDir)) {
        fs.mkdirSync(Logger.logDir, { recursive: true });
      }
    } catch (err) {
      console.error("[Logger] فشل تهيئة مجلد السجلات:", err);
    }
  }

  /**
   * تنسيق الرسالة وتضمين الوقت والنوع والسياق
   */
  private static formatMessage(level: LogLevel, message: string, context?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | السياق: ${JSON.stringify(context)}` : "";
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  /**
   * الكتابة التراكمية في ملف السجلات
   */
  private static writeToFile(formattedMsg: string) {
    try {
      fs.appendFileSync(Logger.logFile, formattedMsg + "\n", "utf-8");
    } catch (err) {
      // تجاهل الخطأ في حال تعذر الكتابة المباشرة على القرص
    }
  }

  /** تسجيل سجل معلومات عامة (INFO) */
  static info(message: string, context?: any) {
    const msg = Logger.formatMessage("INFO", message, context);
    console.log(msg);
    Logger.writeToFile(msg);
  }

  /** تسجيل سجل تحذيري (WARN) */
  static warn(message: string, context?: any) {
    const msg = Logger.formatMessage("WARN", message, context);
    console.warn(msg);
    Logger.writeToFile(msg);
  }

  /** تسجيل سجل أخطاء استثناءات (ERROR) */
  static error(message: string, error?: any, context?: any) {
    let errDetail = "";
    if (error) {
      if (error instanceof Error) {
        errDetail = ` | التفاصيل: ${error.message}\nتتبع الأخطاء: ${error.stack}`;
      } else {
        errDetail = ` | التفاصيل: ${JSON.stringify(error)}`;
      }
    }
    const msg = Logger.formatMessage("ERROR", message, context) + errDetail;
    console.error(msg);
    Logger.writeToFile(msg);
  }

  /** تسجيل سجل تصحيحي مخصص لبيئة التطوير (DEBUG) */
  static debug(message: string, context?: any) {
    if (process.env.NODE_ENV !== "production") {
      const msg = Logger.formatMessage("DEBUG", message, context);
      console.log(msg);
      Logger.writeToFile(msg);
    }
  }

  /**
   * تدقيق وتسجيل العمليات والتحويلات المالية (مدفوعات، فواتير، استردادات، محافظ)
   * @param operation اسم العملية المالية
   * @param details تفاصيل المبلغ، العميل، والطلب
   */
  static financial(operation: string, details: { amount?: number; currency?: string; orderId?: string | number; [key: string]: any }) {
    const msg = Logger.formatMessage("FINANCIAL", `[تدقيق مالي] ${operation}`, details);
    console.log(`\x1b[32m${msg}\x1b[0m`); // طباعة النص باللون الأخضر في الشاشة
    Logger.writeToFile(msg);
  }

  /**
   * تدقيق وتسجيل أحداث الأمان والمصادقة والوصول
   * @param action نوع الإجراء الأمني
   * @param details تفاصيل البريد، عنوان IP، والمستخدم
   */
  static security(action: string, details: { userEmail?: string; ipAddress?: string; [key: string]: any }) {
    const msg = Logger.formatMessage("SECURITY", `[حدث أمني] ${action}`, details);
    console.log(`\x1b[31m${msg}\x1b[0m`); // طباعة النص باللون الأحمر/الكهرماني
    Logger.writeToFile(msg);
  }
}

