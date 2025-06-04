import { Request, Response, NextFunction } from 'express';
import { createClient } from 'redis';
import { logger } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

// Define our custom session type
interface CustomSession {
  id: string;
  analysisState?: any;
  chatHistory?: any[];
  agentResults?: any;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      session: CustomSession;
    }
  }
}

// Initialize Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.connect().catch(console.error);

export const sessionMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionToken = req.headers['x-session-token'] as string;
    let session: CustomSession;

    if (sessionToken) {
      // Try to get existing session from Redis
      const sessionData = await redisClient.get(sessionToken);
      if (sessionData) {
        session = JSON.parse(sessionData);
      } else {
        // Invalid token, create new session
        session = { id: uuidv4() };
      }
    } else {
      // No token provided, create new session
      session = { id: uuidv4() };
    }

    // Attach session to request
    req.session = session;

    // Set session token in response header
    res.setHeader('x-session-token', session.id);

    // Save session to Redis
    await redisClient.set(session.id, JSON.stringify(session));

    next();
  } catch (error) {
    logger.error('Session middleware error:', error);
    next(error);
  }
};

export const configureSession = async (app: any): Promise<void> => {
  try {
    app.use(sessionMiddleware);
    logger.info('Session middleware configured with token-based authentication');
  } catch (error) {
    logger.error('Failed to configure session middleware:', error);
    throw error;
  }
};