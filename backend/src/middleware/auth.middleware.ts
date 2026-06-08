import { NextFunction, Request, Response } from 'express';
import jwt, { Secret } from 'jsonwebtoken';
import { unifiedResponse } from 'uni-response';

import { env } from '../config/env-config';

// Environment variable for JWT secret
const secret: Secret = env.JWT_SECRET as string;

// AuthPayload interface
interface AuthPayload {
  userId: string;
  username: string;
}

// Augment the Express Request object to include custom properties
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      username?: string;
    }
  }
}

/**
 * Authentication Service Class
 * Contains methods for authentication.
 */
class AuthService {
  private secret: Secret;

  constructor(secret: Secret) {
    this.secret = secret;
  }

  /**
   * Authenticate and validate the JWT token
   */
  public auth(req: Request, res: Response, next: NextFunction): void {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json(unifiedResponse(false, 'No token provided'));
      return; // Ensures the middleware ends
    }

    try {
      const decodedToken = jwt.verify(token, this.secret) as AuthPayload;
      req.userId = decodedToken.userId;
      req.username = decodedToken.username;

      next(); // Call the next middleware
    } catch (error) {
      res.status(401).json(unifiedResponse(false, 'Invalid token'));
      return; // Ensures the middleware ends
    }
  }
}

// Instantiate AuthService
const authService = new AuthService(secret);

// Export methods for use in routes
export const auth = authService.auth.bind(authService);
