// Core framework and middleware imports
import express from 'express'; // Web framework for Node.js
import cors from 'cors'; // Cross-Origin Resource Sharing middleware
import dotenv from 'dotenv'; // Environment variables loader

// Application-specific imports
import { errorHandler } from './middleware/errorHandler'; // Global error handling middleware
import { logger } from './utils/logger'; // Winston logger instance
import { dataAnalysisRouter } from './routes/dataAnalysis'; // Main analysis routes
import { setupSwagger } from './utils/swagger'; // API documentation
import { configureSession } from './middleware/sessionMiddleware';
// Load environment variables from .env file
dotenv.config();

// Initialize Express application
const app = express();
const port = process.env.PORT || 3000; // Use PORT from .env or default to 3000

// Global middleware setup
// These run on every request in the order they're defined
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173', // Allow only your frontend origin
    credentials: true, // Allow cookies to be sent and received
  })
);

app.use(express.json()); // Parse JSON request bodies

// API Documentation
setupSwagger(app);
configureSession(app);

// Route configuration
// Mount the data analysis routes under /api
// Example: /api/analyze will handle file uploads
app.use('/api', dataAnalysisRouter);

// Global error handling
// This should be last in the middleware chain
// Catches any errors thrown in our routes
app.use(errorHandler);

// Start the server
app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
  logger.info(`API Documentation available at http://localhost:${port}/api-docs`);
});
