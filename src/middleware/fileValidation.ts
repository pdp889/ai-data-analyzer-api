import { Request, Response, NextFunction } from 'express';
import { fileUploadSchema } from '../types/validation';
import { AppError } from './errorHandler';
import { unlink } from 'fs/promises';
import { logger } from '../utils/logger';

export const validateFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new AppError(400, 'No file uploaded');
    }

    // Validate file using Zod schema
    const result = fileUploadSchema.safeParse({ file: req.file });
    if (!result.success) {
      // Clean up invalid file
      await unlink(req.file.path);
      throw new AppError(400, result.error.errors[0].message);
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const cleanupFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.file) {
      await unlink(req.file.path);
      logger.info(`Cleaned up file: ${req.file.path}`);
    }
    next();
  } catch (error) {
    logger.error('Error cleaning up file:', error);
    next();
  }
}; 