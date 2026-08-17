import { Request, Response, NextFunction } from 'express';
import { ResponseHelper } from '../utils/response';
import { config } from '../config/env';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err);

  if (err instanceof AppError) {
    ResponseHelper.error(res, err.message, err.statusCode);
    return;
  }

  // MySQL duplicate entry error
  if ((err as any).code === 'ER_DUP_ENTRY') {
    ResponseHelper.conflict(res, 'Data already exists');
    return;
  }

  // MySQL foreign key constraint error
  if ((err as any).code === 'ER_NO_REFERENCED_ROW_2') {
    ResponseHelper.badRequest(res, 'Referenced data not found');
    return;
  }

  // Default error
  const message = config.isProduction
    ? 'Internal server error'
    : err.message || 'Internal server error';

  ResponseHelper.error(res, message, 500);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  ResponseHelper.notFound(res, `Route ${req.originalUrl} not found`);
};
