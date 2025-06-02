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

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());

setupSwagger(app);
configureSession(app);

app.use('/api', sessionRouter);
app.use('/api', analysisRouter);
app.use('/api', chatRouter);

app.use(errorHandler);

app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
  logger.info(`API Documentation available at http://localhost:${port}/api-docs`);
});
