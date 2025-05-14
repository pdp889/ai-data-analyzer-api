import { AppError } from '../middleware/errorHandler';
import { logger } from './logger';

export class OpenAIError extends AppError {
  constructor(message: string, status: number = 500) {
    super(status, message);
  }
}

export const handleOpenAIError = (error: any): never => {
  logger.error('OpenAI API Error:', error);

  if (error.message?.includes('insufficient_quota') || error.message?.includes('exceeded your current quota')) {
    throw new OpenAIError('OpenAI API quota exceeded. Please check your billing details and try again later.', 429);
  }
  
  if (error.status === 429) {
    throw new OpenAIError('OpenAI API rate limit exceeded. Please try again later.', 429);
  }
  
  if (error.status === 401) {
    throw new OpenAIError('Invalid OpenAI API key. Please check your configuration.', 401);
  }

  throw new OpenAIError('Failed to process OpenAI request');
}; 