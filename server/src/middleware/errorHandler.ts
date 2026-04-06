import type { Request, Response, NextFunction } from 'express';
import { Prisma } from 'generated-prisma-client';
import { ZodError } from 'zod';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let statusCode = err instanceof AppError ? err.statusCode : 500;
  let message = err instanceof AppError ? err.message : 'Internal Server Error';

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      statusCode = 409;
      message = 'A record with this value already exists';
    }
    if (err.code === 'P2025') {
      statusCode = 404;
      message = 'Record not found';
    }
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    statusCode = 400;
    message = err.issues.map((e) => e.message).join(', ');
  }

  // Log errors in production
  if (process.env.NODE_ENV === 'production') {
    console.error(`[${new Date().toISOString()}] Error: ${err.message}`, err.stack);
  }

  const response: Record<string, unknown> = {
    error: {
      message,
      statusCode,
    },
  };

  if (process.env.NODE_ENV === 'development') {
    (response.error as Record<string, unknown>).stack = err.stack;
  }

  res.status(statusCode).json(response);
};
