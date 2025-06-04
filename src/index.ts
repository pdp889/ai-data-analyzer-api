import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { sessionRouter } from './routes/session.route';
import { analysisRouter } from './routes/analysis.route';
import { chatRouter } from './routes/chat.route';

import { setupSwagger } from './utils/swagger';
import { configureSession } from './middleware/sessionMiddleware';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

if (!process.env.FRONTEND_ORIGIN) {
  logger.warn('FRONTEND_ORIGIN environment variable is not set. CORS will be disabled for security.');
}

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || false,
    credentials: true,
  })
);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

setupSwagger(app);
app.use(helmet()); // Security headers
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));

// Start the server
const startServer = async () => {
  try {
    // Initialize session middleware
    await configureSession(app);
    
    // Register routes
    app.use('/api', sessionRouter);
    app.use('/api', analysisRouter);
    app.use('/api', chatRouter);

    // Error handler must be registered after routes
    app.use(errorHandler);

    app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
      logger.info(`API Documentation available at http://localhost:${port}/api-docs`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
