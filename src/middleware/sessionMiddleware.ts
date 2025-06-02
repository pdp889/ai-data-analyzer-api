import session from 'express-session';
import { Express } from 'express';
import { AnalysisState } from '@/schemas/analysis.schema';

// Augment express-session to include our custom session data
declare module 'express-session' {
  interface SessionData {
    analysisState?: AnalysisState;
  }
}

export const configureSession = (app: Express): void => {
  const isProduction = process.env.NODE_ENV === 'production';
  console.log(
    `Session Middleware: Configuring for NODE_ENV='${process.env.NODE_ENV}', isProduction=${isProduction}`
  );

  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'your default secret key here', // IMPORTANT: Use an environment variable for the secret in production
      resave: false,
      saveUninitialized: true,
      cookie: {
        secure: isProduction, // true if isProduction, false otherwise
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        path: '/', // Explicitly set path, good practice
        sameSite: isProduction ? 'none' : 'lax', // 'none' for HTTPS prod, 'lax' for HTTP dev
      },
    })
  );
  console.log('Session middleware configured with environment-specific cookie settings.');
};
