import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/response';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors ?? null,
    });
  }

  console.error('[Unhandled Error]', err);
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    errors: null,
  });
}