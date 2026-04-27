import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: 'ADMIN' | 'QA_MANAGER' | 'HANDLER' | 'VIEWER';
    departmentId: string;
    mustChangePassword: boolean;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthRequest['user'];
    req.user = decoded;

    // Enforce password change if flag is set
    if (decoded?.mustChangePassword) {
      const allowedPaths = ['/api/auth/change-password-enforced', '/api/auth/me'];
      if (!allowedPaths.includes(req.baseUrl + req.path)) {
        return res.status(403).json({ 
          error: 'Password change required', 
          mustChangePassword: true 
        });
      }
    }

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    next();
  };
};
