import { NextFunction, Request, Response } from 'express';
import jwt, { Secret } from 'jsonwebtoken';
import { unifiedResponse } from 'uni-response';

import { env } from '../config/env-config.js';
import { CrewTokenPayload } from '../features/crew/types/crew.types.js';
import { generateToken } from '../utils/generate-token.util.js';

// Use a dedicated crew secret when provided, fall back to JWT_SECRET
const crewSecret: Secret = env.JWT_SECRET as string;

// Augment Express Request to carry personId from crew JWT
declare global {
  namespace Express {
    interface Request {
      personId?: string;
    }
  }
}

class CrewAuthService {
  private secret: Secret;

  constructor(secret: Secret) {
    this.secret = secret;
  }

  public crewAuth(req: Request, res: Response, next: NextFunction): void {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json(unifiedResponse(false, 'No token provided'));
      return;
    }

    try {
      const decoded = jwt.verify(token, this.secret) as CrewTokenPayload;
      if (decoded.tokenType !== 'crew') {
        res
          .status(401)
          .json(unifiedResponse(false, 'Access denied: invalid token type'));
        return;
      }
      
      req.personId = decoded.personId;
      next();
    } catch {
      res.status(401).json(unifiedResponse(false, 'Invalid token'));
    }
  }
}

const crewAuthService = new CrewAuthService(crewSecret);

export const crewAuth = crewAuthService.crewAuth.bind(crewAuthService);

/**
 * Generate a signed JWT for a crew member.
 */
export function generateCrewToken(personId: string): string {
  return generateToken({ personId, tokenType: 'crew' });
}

