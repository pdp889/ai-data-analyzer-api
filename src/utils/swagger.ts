import { Express } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI Data Analyzer API',
      version: '1.0.0',
      description: `Multi-Agent Data Analysis API that leverages AI to provide deep insights from CSV data.

## Features
- **Profiler Agent**: Analyzes dataset structure and provides statistical insights
- **Detective Agent**: Identifies patterns, correlations, and anomalies
- **Storyteller Agent**: Generates human-readable narratives from the analysis

## Authentication
- Session-based authentication
- Rate limiting applied to all endpoints

## File Requirements
- Only CSV files are supported
- Maximum file size: 5MB (configurable via MAX_FILE_SIZE env variable)

## Response Format
All successful responses follow the format:
\`\`\`json
{
  "success": true,
  "data": {
    // Response data specific to each endpoint
  }
}
\`\`\`

## Error Handling
Errors follow the format:
\`\`\`json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
\`\`\``,
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: process.env.API_URL || 'https://api.your-domain.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
          description: 'Session cookie for authentication'
        }
      }
    },
    security: [{
      sessionAuth: []
    }]
  },
  apis: ['./src/routes/*.ts'], // Path to the API routes
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "AI Data Analyzer API Documentation",
    customfavIcon: "/favicon.ico"
  }));
};
