import { Request, Response } from 'express';
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

export function handleOpenAIError(error: any): never {
  logger.error('OpenAI API Error:', error);

  if (
    error.message?.includes('insufficient_quota') ||
    error.message?.includes('exceeded your current quota')
  ) {
    throw new AppError(
      429,
      'OpenAI API quota exceeded. Please check your billing details and try again later.'
    );
  }

  if (error.status === 429) {
    throw new AppError(429, 'OpenAI API rate limit exceeded. Please try again later.');
  }

  if (error.status === 401) {
    throw new AppError(401, 'Invalid OpenAI API key. Please check your configuration.');
  }

  if (error.message?.includes('No content in OpenAI response')) {
    throw new AppError(500, 'No response received from OpenAI. Please try again.');
  }

  if (error.message?.includes('Invalid response format')) {
    throw new AppError(500, 'Invalid response format from OpenAI. Please try again.');
  }

  // Handle validation errors
  if (
    error.message?.includes('Invalid insight structure') ||
    error.message?.includes('Response must contain an array of insights')
  ) {
    throw new AppError(500, 'Invalid insight structure in response. Please try again.');
  }

  // Handle empty dataset errors
  if (error.message?.includes('Empty dataset provided')) {
    throw new AppError(400, 'Empty dataset provided. Please provide data for analysis.');
  }

  // Handle missing profile errors
  if (error.message?.includes('Dataset profile is required')) {
    throw new AppError(400, 'Dataset profile is required for analysis.');
  }

  // Default error
  throw new AppError(500, 'An unexpected error occurred during analysis. Please try again.');
}

export const errorHandler = (err: Error, req: Request, res: Response) => {
  logger.error('Error:', err);

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
