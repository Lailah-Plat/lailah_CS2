import { Request, Response, NextFunction } from 'express';

export const loggerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const { method, originalUrl, ip } = req;
  
  // Only log API routes to prevent cluttering the logs with frontend assets or Vite files in dev
  if (!originalUrl.startsWith('/api')) {
    return next();
  }

  const start = Date.now();
  const userAgent = req.get('user-agent') || '';

  // Once request finishes, log details
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const userId = req.user ? req.user.id : (req.headers['x-user-id'] || 'guest');
    const userRole = req.headers['x-user-role'] || (req.user?.role?.name || 'guest');

    console.log(
      `🌐 [API-LOG] ${new Date().toISOString()} | ${method} ${originalUrl} | Status: ${statusCode} | Time: ${duration}ms | IP: ${ip} | UserID: ${userId} (${userRole}) | UA: ${userAgent}`
    );
  });

  next();
};
