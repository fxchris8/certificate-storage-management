import { NextFunction, Request, Response } from 'express';

import { UserService } from '../services/user.service';
import { LoginInputTypes, RegisterInputTypes, UpdateUserInputTypes } from '../types/user.types';

export class UserController {
  private userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  heartbeat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.userService.heartbeat();
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  };

  getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const search = req.query.search as string | undefined;

      const result = await this.userService.getAllUsers({ page, limit, search });
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  };

  getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.userService.getUserById(id);
      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      next(error);
    }
  };

  login = async (
    req: Request<{}, {}, LoginInputTypes>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const loginInputObj: LoginInputTypes = req.body;
      const result = await this.userService.login(loginInputObj);
      res.status(result.success ? 200 : 401).json(result);
    } catch (error) {
      next(error);
    }
  };

  register = async (
    req: Request<{}, {}, RegisterInputTypes>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const registerInputObj: RegisterInputTypes = req.body;
      const result = await this.userService.register(registerInputObj);
      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId;
      if (userId) {
        const result = await this.userService.getProfile(userId);
        res.status(result.success ? 200 : 404).json(result);
      } else {
        res.status(401).json({ success: false, message: 'Unauthorized' });
      }
    } catch (error) {
      next(error);
    }
  };

  updateUser = async (
    req: Request<{ id: string }, {}, UpdateUserInputTypes>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: UpdateUserInputTypes = req.body;
      const result = await this.userService.updateUser(id, updateData);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.userService.deleteUser(id);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  };
}
