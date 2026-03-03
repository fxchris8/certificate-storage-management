import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env-config.js';
import { ERROR } from '../constants/messages.js';

export const validateApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.header('X-API-Key');
  
  if (!env.EXTERNAL_API_KEY) {
    return next();
  }

  if (!apiKey || apiKey !== env.EXTERNAL_API_KEY) {
    res.status(401).json({
      success: false,
      message: ERROR.UNAUTHORIZED_API_KEY,
    });
    return;
  }

  next();
};
