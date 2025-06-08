import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import https from 'https';
import fs from 'fs';

import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { sessionRouter } from './routes/session.route';
import { analysisRouter } from './routes/analysis.route';
import { chatRouter } from './routes/chat.route';
import { SessionService } from './services/session.service';

import { setupSwagger } from './utils/swagger';
import { configureSession } from './middleware/sessionMiddleware';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

if (!process.env.FRONTEND_ORIGIN) {
  logger.warn(
    'FRONTEND_ORIGIN environment variable is not set. CORS will be disabled for security.'
  );
}

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || false,
    credentials: true,
    exposedHeaders: ['x-session-token'],
  })
);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

setupSwagger(app);
app.use(helmet()); // Security headers

// Trust proxy before rate limiter
app.set('trust proxy', 1);

// Configure rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    error: {
      message: 'Too many requests, please try again later.',
      code: 429
    }
  },
  // Skip rate limiting for health check endpoints
  skip: (req) => req.path === '/health' || req.path === '/api-docs'
});

app.use(limiter);

// Start the server
const startServer = async () => {
  try {
    // Initialize session middleware
    await configureSession(app);

    // Initialize SessionService
    await SessionService.init();

    // Register routes
    app.use('/api', sessionRouter);
    app.use('/api', analysisRouter);
    app.use('/api', chatRouter);

    // Error handler must be registered after routes
    app.use(errorHandler);

    if (process.env.NODE_ENV === 'production') {
      // HTTPS configuration
      const httpsOptions = {
        key: fs.readFileSync(process.env.KEY_PATH || ''),
        cert: fs.readFileSync(process.env.CERT_PATH || ''),
      };

      // Create HTTPS server
      https.createServer(httpsOptions, app).listen(port, () => {
        logger.info(`HTTPS Server is running on port ${port}`);
        logger.info(`API Documentation available at https://api.ai-analyzer-project.com/api-docs`);
      });
    } else {
      // Development server
      app.listen(port, () => {
        logger.info(`Development server is running on port ${port}`);
        logger.info(`API Documentation available at http://localhost:${port}/api-docs`);
      });
    }
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
