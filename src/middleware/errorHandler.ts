import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error:', err);

  // Handle OpenAI API quota errors
  if (err.message.includes('insufficient_quota') || err.message.includes('exceeded your current quota')) {
    return res.status(429).json({
      status: 'error',
      message: 'OpenAI API quota exceeded. Please check your billing details and try again later.',
      error: 'QUOTA_EXCEEDED'
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  // Default error
  return res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
}; 