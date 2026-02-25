import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';

import { env } from './config/env-config';
import userRoutes from './features/user/routes/user.routes';
import authRoutes from './features/user/routes/auth.routes';
import ssoRoutes from './features/user/routes/sso.routes';
import personRoutes from './features/person/routes/person.routes';
import certificateRoutes from './features/certificate/routes/certificate.routes';
import { apiErrorHandler, unmatchedRoutes } from './middleware/api-error.middleware';
import { pinoLogger, loggerMiddleware } from './middleware/pino-logger';
// import morgan from 'morgan';
import { hostWhitelist, rateLimiter } from './middleware/security.middleware';

const app: Application = express();

// Security middleware
// app.use(hostWhitelist);
app.use(rateLimiter);
app.use(helmet());

// Global Middlewares
app.use(express.json());

const allowedURLs = env.WHITE_LIST_URLS || [];
app.use(cors({ origin: allowedURLs, credentials: true, exposedHeaders: ['Content-Disposition'] })); // Enables CORS with whitelist


app.get('/', hostWhitelist(allowedURLs), (req: Request, res: Response): void => {
  res.json('');
  return;
});

app.get('/heartbeat', (req: Request, res: Response): void => {
  req.log.info('Heartbeat ok');
  res.send('ok');
  return;
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auth/sso', ssoRoutes);
app.use('/api/persons', personRoutes);
app.use('/api/certificates', certificateRoutes);

// Error Handling Middleware (Optional)
// For prisma error and other error
app.use(apiErrorHandler);

// Middleware for handling unmatched routes
app.use(unmatchedRoutes);

export { app };
