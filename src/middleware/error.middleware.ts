import { Request, Response, NextFunction } from 'express';

export interface CustomError extends Error {
  status?: number;
  statusCode?: number;
}

export const errorMiddleware = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || "حدث خطأ في الخادم أثناء معالجة الطلب";
  const stack = process.env.NODE_ENV !== 'production' ? err.stack : undefined;

  console.error(`❌ [API-ERROR] Error handler caught an exception at ${req.method} ${req.originalUrl}:`, {
    message,
    statusCode,
    stack,
  });

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(stack && { stack })
  });
};
