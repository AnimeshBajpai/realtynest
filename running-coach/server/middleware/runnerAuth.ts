import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface RunnerJwtPayload {
  id: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      runner?: RunnerJwtPayload;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';

export const authenticateRunner = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;
  const token =
    authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as RunnerJwtPayload;
    req.runner = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
