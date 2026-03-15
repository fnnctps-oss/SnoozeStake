import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  userId?: string;
}

// TODO: Remove mock-token bypass before production
const DEV_MOCK_USER_ID = 'mock-1';

export function requireAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError(401, 'Missing or invalid authorization header');
  }

  const token = authHeader.split(' ')[1];

  // Dev bypass: accept mock-token for local development
  if (process.env.NODE_ENV !== 'production' && token === 'mock-token') {
    req.userId = DEV_MOCK_USER_ID;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch {
    throw new AppError(401, 'Invalid or expired token');
  }
}
