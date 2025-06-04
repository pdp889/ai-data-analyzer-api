import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (err: Error, req: Request, res: Response) => {
  logger.error('Error:', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.statusCode,
      },
    });
  }

  // Default error
  return res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      code: 500,
    },
  });
};
