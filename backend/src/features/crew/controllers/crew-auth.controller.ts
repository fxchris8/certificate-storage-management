import { NextFunction, Request, Response } from 'express';

import { CrewAuthService } from '../services/crew-auth.service.js';
import { CrewLoginInput, CrewRegisterInput } from '../types/crew.types.js';

export class CrewAuthController {
  constructor(private crewAuthService: CrewAuthService) {}

  register = async (
    req: Request<object, object, CrewRegisterInput>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.crewAuthService.register(req.body);
      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      next(error);
    }
  };

  login = async (
    req: Request<object, object, CrewLoginInput>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.crewAuthService.login(req.body);
      res.status(result.success ? 200 : 401).json(result);
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { personId } = req.params;
      const { newPassword } = req.body as { newPassword: string };
      const result = await this.crewAuthService.resetPassword(personId, newPassword);
      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      next(error);
    }
  };
}
