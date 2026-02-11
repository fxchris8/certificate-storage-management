import { Router } from 'express';

import { PrismaService } from '../../../config/prisma.config';
import { auth } from '../../../middleware/auth.middleware';
import { validateRequest } from '../../../middleware/validation.middleware';
import { UserController } from '../controllers/user.controller';
import { UserRepository } from '../repositories/user.repository';
import { loginSchema, registerSchema, updateUserSchema } from '../schemas/user.schema';
import { UserService } from '../services/user.service';

// Dependency Injection
const prismaService = PrismaService.getInstance();
const prisma = prismaService.client; // Get the PrismaClient instance
const userRepository = new UserRepository(prisma);
const userService = new UserService(userRepository);
const userController = new UserController(userService);

const router = Router();

// Public routes
router.get('/heartbeat', userController.heartbeat);
router.post('/create', validateRequest(registerSchema), userController.register);

// Protected routes (require auth)
router.get('/', auth, userController.getAllUsers);
router.get('/profile', auth, userController.getProfile);
router.get('/:id', auth, userController.getUserById);
router.put('/:id', auth, validateRequest(updateUserSchema), userController.updateUser);
router.delete('/:id', auth, userController.deleteUser);

export default router;
