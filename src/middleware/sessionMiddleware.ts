import session from 'express-session';
import { Express } from 'express';
import { logger } from '@/utils/logger';
import { createClient } from 'redis';
import { RedisStore } from 'connect-redis'; // ✅ Named import, not default

export const configureSession = async (app: Express): Promise<void> => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Initialize Redis client
    let redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    redisClient.connect().catch(console.error);
    
    // Initialize store using modern syntax
    let redisStore = new RedisStore({
      client: redisClient,
      prefix: "myapp:", // or whatever prefix you want
    });
   
    app.use(session({
      store: redisStore,
      resave: false, // required: force lightweight session keep alive (touch)
      saveUninitialized: false, // recommended: only save session when data exists
      secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
      cookie: {
        secure: isProduction,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
        sameSite: isProduction ? 'none' : 'lax',
      },
    }));
   
    logger.info('Session middleware configured with Redis store');
  } catch (error) {
    logger.error('Failed to configure session middleware:', error);
    throw error;
  }
};