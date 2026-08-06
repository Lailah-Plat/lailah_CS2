import { Request, Response, NextFunction } from 'express';

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // In a real application, user info would be extracted from token
    const userRole = req.headers['x-user-role'] as string;
    
    if (!userRole) {
      return res.status(401).json({ error: 'Unauthorized: No role specified' });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
};
