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
      code: 429,
    },
  },
  // Skip rate limiting for health check endpoints
  skip: (req) => req.path === '/health' || req.path === '/api-docs',
});

app.use(limiter);

// Secure certificate loading function
const loadCertificates = () => {
  const keyPath = process.env.KEY_PATH;
  const certPath = process.env.CERT_PATH;

  if (!keyPath || !certPath) {
    throw new Error('KEY_PATH and CERT_PATH environment variables are required for HTTPS');
  }

  // Validate file paths
  if (!fs.existsSync(keyPath)) {
    throw new Error(`SSL key file not found: ${keyPath}`);
  }
  if (!fs.existsSync(certPath)) {
    throw new Error(`SSL certificate file not found: ${certPath}`);
  }

  try {
    const key = fs.readFileSync(keyPath);
    const cert = fs.readFileSync(certPath);

    logger.info('SSL certificates loaded successfully');
    return { key, cert };
  } catch (error) {
    // Don't log the actual error content to prevent certificate leakage
    logger.error('Failed to load SSL certificates');
    throw new Error('SSL certificate loading failed');
  }
};

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

    // Catch-all route for invalid endpoints - prevents error logging
    app.use('*', (req, res) => {
      // Log the attempt but don't expose sensitive data
      logger.warn(`Invalid endpoint accessed: ${req.method} ${req.originalUrl} from ${req.ip}`);

      res.status(404).json({
        success: false,
        error: {
          message: 'Endpoint not found',
          code: 404,
        },
      });
    });

    // Error handler must be registered after routes
    app.use(errorHandler);

    if (process.env.NODE_ENV === 'production') {
      // HTTPS configuration with secure certificate loading
      const httpsOptions = loadCertificates();

      // Create HTTPS server with error handling to prevent certificate leakage
      const httpsServer = https.createServer(httpsOptions, app);

      // Add error handlers to prevent certificate leakage
      httpsServer.on('error', (error) => {
        // Only log error message, not the full error object
        logger.error('HTTPS Server Error:', error.message);
      });

      httpsServer.listen(port, () => {
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
    // Secure error logging - don't log sensitive content
    if (error instanceof Error) {
      logger.error('Failed to start server:', error.message);
    } else {
      logger.error('Failed to start server: Unknown error');
    }
    process.exit(1);
  }
};

startServer();
