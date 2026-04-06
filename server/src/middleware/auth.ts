import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from 'generated-prisma-client';
import { config } from '../config/index.js';
import { AppError } from './errorHandler.js';

export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  agencyId: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticateToken = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;
  const token =
    authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const cookieToken = req.cookies?.accessToken as string | undefined;

  const finalToken = token || cookieToken;

  if (!finalToken) {
    throw new AppError('Authentication required', 401);
  }

  try {
    const decoded = jwt.verify(finalToken, config.jwtSecret) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    throw new AppError('Invalid or expired token', 401);
  }
};

export const authorizeRoles = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError('Insufficient permissions', 403);
    }

    next();
  };
};
