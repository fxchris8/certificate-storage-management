import jwt, { Secret } from 'jsonwebtoken';

import { env } from '../config/env-config.js';

const secret: Secret = env.JWT_SECRET as string;

export interface TokenPayload {
  userId?: string;
  personId?: string;
  tokenType: 'user' | 'crew';
  role?: string;
}

const generateToken = (payload: TokenPayload): string => {
  if (secret) {
    const token = jwt.sign(payload, secret);

    return token;
  }
  throw new Error('JWT SECRET is undefined');
};

export { generateToken };

